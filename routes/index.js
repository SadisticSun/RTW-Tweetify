const express = require('express');
const Router = express.Router();

const client_id = '1eea3c72369f45a8908bc3d243d8acef';
const client_secret = '732dd6b4f0a64bfb8c07a25838ed4b7b';
const redirect_uri = 'https://rtw-tweetify.herokuapp.com/login';
const scope = 'user-top-read user-read-private user-read-currently-playing user-read-playback-state';

// Base Request URL
const base_URL = 'https://accounts.spotify.com/authorize/';
var request_url = base_URL + '?client_id=' + client_id + '&scope=' + scope + '&response_type=code&redirect_uri=' + redirect_uri + "&show_dialog=true";

Router.get('/', function(req, res) {
    res.render('index', {
        title: 'Tweetify',
        request_url: request_url
    });
});

module.exports = Router;
