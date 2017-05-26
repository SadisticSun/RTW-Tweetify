const express = require('express');
const Router = express.Router();
const request = require('request');
const dotenv = require('dotenv').config();

// import models
const User = require('../models/user.js');

// Spotify information
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;
const scope = 'user-top-read user-read-private user-read-currently-playing user-read-playback-state';

var user_info = {};
var artist_data = {};
var last_played = {};
var access_token ='';

// Base Request URL
const base_URL = 'https://accounts.spotify.com/authorize?';
var request_url = base_URL + '?client_id=' + client_id + '&scope=' + scope + '&response_type=code&redirect_uri=' + redirect_uri;

// Access Token POST request options
var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
        client_id: client_id,
        code: 'code',
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
    },
    headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
    },
    json: true
};


// Database config
const dbconfig = {

// Check if user exists by looking for the user ID in database. If not, then create new user
    checkForExistingUser: (user) => {
        User.count({
            _id: user.id
        }, (err, count) => {
            if (count > 0) {
                console.log('[Server] User already exists in database');
            } else {
                User.create({
                    _id: user.id,
                    name: user.display_name
                }, (err) => {
                    if (err) {
                        console.log('[Server] ERROR: Cannot add user to database');
                        console.log(err);
                    } else {
                        console.log('[Server] New User saved to database');
                    }
                });
            }
        });
    },

// Find the current user and update the top 20 artist in database
    updateArtistData: (data) => {
        User.findById(user_info.id, (err, user) => {
            if (err) {
                console.log('[Server] ERROR: Could not find user by ID trying to update Top Artists');
            } else {
                user.artists = data.items;
                user.save((err, user) => {
                    if (err) {
                        console.log('[Server] ERROR: Could not update artist data');
                    } else {
                        console.log('[Server] Succesfully updated artist data');
                    }
                })
            }
        })
    },

// Find the current user and update the now playing info in database with a 1.5 second delay
    updateNowPlaying: (data) => {
        setTimeout(function() {
            User.findById(user_info.id, (err, user) => {
                if (err) {
                    console.log('[Server] ERROR: Could not find user by ID trying to update Now Playing');
                } else {
                    user.lastPlayedArtist.name = data.item.album.artists[0].name;
                    user.lastPlayedArtist.song = data.item.name;
                    user.save((err, user) => {
                        if (err) {
                            console.log('[Server] ERROR: Could not update Now Playing data');
                        } else {
                            console.log('[Server] Succesfully updated Now Playing data');
                        }
                    })
                }
            })
        }, 1500)
    },

    getUserInfo: function () {

      User.findById(user_info.id, (err, user) => {
        if (err) {
          console.log('[Server] ERROR: Could not get user information from DB');
        } else {
          artist_data = user;
        }
      });
    }
};

Router.get('/login', (req, res) => {

    // Save the Authorization Code for later use
    authOptions.form.code = req.query.code;


    // Do POST request to API
    request.post(authOptions, (error, response, body) => {

        access_token = body.access_token;

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

        function getDataFromAPI() {
            console.log('[Server] Getting information from Spotify ...');

            request.get(authOptionsForUserInformation, (error, response, body) => {
                dbconfig.checkForExistingUser(body);
                user_info = body;
            });

            // Get user's top 20 artists
            request.get(authOptionsForTopArtists, (error, response, body) => {
                dbconfig.updateArtistData(body);
                artist_data = body;
            });

            // Get user's recently played track
            request.get(authOptionsForNowPlaying, (error, response, body) => {
                dbconfig.updateNowPlaying(body);
                last_played = body;

            });
        }

        // If there's an error in the POST request, render ERROR page
        if (body.error) {

            res.render('error', {
                'error': body.error,
                'description': body.error_description
            });
            // When all goes well, get data from API
        } else {
            getDataFromAPI();
            dbconfig.getUserInfo();

            setTimeout(function() {
                res.render('login', {
                    user_data: user_info,
                    artist_data: artist_data,
                    last_song: last_played
                });
            }, 2000);

        }
    });
});

module.exports = Router;
