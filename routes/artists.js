const express = require('express');
const Router = express.Router();
const Twitter = require('twitter');
const dotenv  = require('dotenv').config();

// Twitter Keys
const twitter_cons_key            = process.env.TWITTER_CONS_KEY;
const twitter_cons_secret         = process.env.TWITTER_CONS_SECRET;
const twitter_access_token        = process.env.TWITTER_ACCESS_TOKEN;
const twitter_token_secret        = process.env.TWITTER_TOKEN_SECRET;

module.exports = io => {
  var T = new Twitter({
    consumer_key:                   twitter_cons_key,
    consumer_secret:                twitter_cons_secret,
    access_token_key:               twitter_access_token,
    access_token_secret:            twitter_token_secret
  });

  Router.get('/artist/:id', function(req, res, next) {
    var twitter_filter = req.params.id;
    console.log(twitter_filter);

    io.on('connection', socket => {
      T.stream('statuses/filter', {
        track: twitter_filter
      }, stream => {
        stream.on('data', emitTweet);
        function emitTweet(tweet) {
          socket.emit('tweet', tweet);
        }

        stream.on('error', function(err) {
          console.log(err);
        });

        socket.on('disconnect', () => {
          console.log('User disconnected');
          stream.destroy();
          stream.on('end', () => {
            console.log('Stream stopped');
          })
        })
      });
    });

    res.render('../views/artist', { artist: twitter_filter });
  });

  return Router;
};
