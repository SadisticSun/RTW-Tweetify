# Real-time Web App: Tweetify

## About the app
This application is the result of the assignments for the course Real Time Web. The assignment was to create a webapplication
that renders data from an external source (API) of one's own choosing and create a real-time connection between the server and the client to send data from the API.

Tweetify allows the user to see what their top 20 artists are on Spotify
and what people tweet about these artists.

## Live App
Check the app live at https://rtw-tweetify.herokuapp.com/

## App Flow
The user is presented a welcome screen which prompts the user to log in with their Spotify account.
After the user clicks the login button an OAuth procedure starts, asking for the user's permission to access some of said users information.
The application then retrieves this information from the Spotify API and redirects to the main view, showing the user's top 20 artists.
When all data is loaded, the user can see what track they listened to most recently and click one of the top 20 artists to start the Twitter feed.
The user is presented a page showing a real-time Twitter stream about the chosen artist.

NOTE: Depending on the popularity of the chosen artist the page can be empty. This is normal as the app only shows the newest tweets real-time and it can take a while before someone tweets about the artist.

## Dependencies
 * Express
 * Socket.io
 * Twitter (npm package)
 * EJS
 * Dotenv
 * Request
 * Compression
 * Body Parser
 * Mongoose

## Installation
1. Clone this repository
2. Navigato to your local version of this repository with the command line
3. Create a new Spotify account or use an already existing one
4. Create an new app on https://developer.spotify.com/my-applications/
5. Set the redirect uri to ```http://localhost:8080/login```
6. Create a new app on Twitter and get the keys
7. Create a ```.env``` file with the following variables:

```
CLIENT_SECRET= <your Spotify client id>
CLIENT_ID= <your Spotify client secret>
TWITTER_CONS_KEY= <your Twitter consumer key>
TWITTER_CONS_SECRET= <your Twitter consumer secret>
TWITTER_ACCESS_TOKEN= <your Twitter access token>
TWITTER_TOKEN_SECRET= <your Twitter token secret>
```
7. Run the app with
```
node app.js

// or if you have Nodemon installed

nodemon app.js
```

## Technical Features
### OAuth 2.0
Tweetify connects to the user's Spotify information using OAuth's Authorization Code flow.

When the user clicks the 'Login with Spotify' button on the index page an URL is sent to the Spotify API:
```javascript
// Example
const base_URL = 'https://accounts.spotify.com/authorize/';
var request_url = base_URL + '?client_id=' + client_id + '&scope=' + scope + '&response_type=code&redirect_uri=' + redirect_uri + "&show_dialog=true";
```

This URL contains the redirect URI that Spotify will redirect to after the authorization completes. The route for this is always a ```/login``` route.

Example: ```https://tweetify.com/login```

When ```/login``` is loaded, a POST request is done to the Spotify API to request the user information, using the unique access token provided by the API.

```javascript
Router.get('/login', (req, res) => {

    // Save the Authorization Code for later use
    authOptions.form.code = req.query.code;


    // Do POST request to API
    request.post(authOptions, (error, response, body) => {

        access_token = body.access_token;

        ... // More functions are executed below the fold
      })
    })
```

3 Objects are created containing information for the API calls.
These contain the base URL to a specific API endpoint, as well as the required headers.

```javascript
var authOptionsForTopArtists = {
    url: 'https://api.spotify.com/v1/me/top/artists',
    headers: {
        'Authorization': 'Bearer ' + access_token
    },
    json: true
};

var authOptionsForUserInformation = {
    url: 'https://api.spotify.com/v1/me/',
    headers: {
        'Authorization': 'Bearer ' + access_token
    },
    json: true
};

var authOptionsForNowPlaying = {
    url: 'https://api.spotify.com/v1/me/player/currently-playing/',
    headers: {
        'Authorization': 'Bearer ' + access_token
    },
    json: true
};
```

A function is then declared to get information from the API with 3 requests.
This data can be retrieved asynchronously so no delays/promises are needed.
```javascript
function getDataFromAPI() {
    console.log('[Server] Getting information from Spotify ...');

    request.get(authOptionsForUserInformation, (error, response, body) => {

        // Check if the user already exists in the database. If not, a new user is created.
        dbconfig.checkForExistingUser(body);
        user_info = body;
    });

    request.get(authOptionsForTopArtists, (error, response, body) => {

        // Get user's top 20 artists and update them in the database
        dbconfig.updateArtistData(body);
        artist_data = body;
    });

    request.get(authOptionsForNowPlaying, (error, response, body) => {

        // Get user's recently played track and update it in the database
        dbconfig.updateNowPlaying(body);
        last_played = body;

    });
}

```

After all these functions are declared, call them if there are no errors in the POST request. The user's basic information (name) is also requested. Then, render the login page and supply the route with the retrieved information.
```javascript
getDataFromAPI();
dbconfig.getUserInfo();

setTimeout(function() {
    res.render('login', {
        user_data: user_info,
        artist_data: artist_data,
        last_song: last_played
    });
}, 900);
```
---
### Twitter and Socket.io
When the user clicks on an artist, the ```/artist/:id``` route is loaded.
The Twitter keys are used here.
```javascript
// Twitter Keys
const twitter_cons_key            = process.env.TWITTER_CONS_KEY;
const twitter_cons_secret         = process.env.TWITTER_CONS_SECRET;
const twitter_access_token        = process.env.TWITTER_ACCESS_TOKEN;
const twitter_token_secret        = process.env.TWITTER_TOKEN_SECRET;
```

Then, a new instance of the Twitter class is created:
```javascript
var T = new Twitter({
  consumer_key:                   twitter_cons_key,
  consumer_secret:                twitter_cons_secret,
  access_token_key:               twitter_access_token,
  access_token_secret:            twitter_token_secret
});
```
When the route is loaded, the requested artist is retrieved from the parameters of the query and saved in ```var twitter_filter```
```javascript
Router.get('/artist/:id', function(req, res, next) {
  var twitter_filter = req.params.id;
  console.log(twitter_filter);

  // Listen for the connection event
  io.on('connection', socket => {

    // Start a new Twitter stream and track the requested query (the artist)
    T.stream('statuses/filter', {
      track: twitter_filter
    }, stream => {
    // When a new Tweet is posted, emit the emitTweet function
      stream.on('data', emitTweet);

      function emitTweet(tweet) {
        socket.emit('tweet', tweet);
      }
      // If there's an error, log it
      stream.on('error', function(err) {
        console.log(err);
      });

      // Destroy the stream when the user disconnects/leaves the page
      socket.on('disconnect', () => {
        console.log('User disconnected');
        stream.destroy();
        stream.on('end', () => {
          console.log('Stream stopped');
        })
      })
    });
  });

  // Render the page with the artist name
  res.render('../views/artist', { artist: twitter_filter });
});
```
---
### Offline feedback
When the user's internet drops or the server has crashed, the user will be informed about these events and provided a 'reconnect' functionality.

To achieve this, I used the Offline.js micro-library.

Check it out at: http://github.hubspot.com/offline/docs/welcome/

## Known Issues
* Most Recent Track doesn't update real-time
* Refreshing the main view can throw an error

## Wishlist
* Real-time 'Most Recently Played' feature
* Relocate Twitter stream to main view
* See top artists of other (online) users (profile system)
* User feedback on data loading (loading spinner)
* Responsive Design
* Better UI design/more pretty stuff
