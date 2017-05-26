const express = require('express');
const Router = express.Router();

// Spotify Keys
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_url = process.env.REDIRECT_URI;
const response_type = 'code';
const grant_type = 'authorization_code';
const scope = 'user-top-read user-read-private user-read-currently-playing user-read-playback-state';
const redirect_uri = 'http://localhost:3000/login';

// Base Request URL
const base_URL = 'https://accounts.spotify.com/authorize/';
var request_url = base_URL + '?client_id=' + client_id + '&scope=' + scope + '&response_type=' + response_type + '&redirect_uri=' + redirect_uri;
console.log(request_url);

Router.get('/', function(req, res) {
    res.render('index', {
        title: 'Tweetify',
        request_url: request_url
    });
});

module.exports = Router;
