const mongoose = require('mongoose');

var User = mongoose.model('spotifyUser', {
  _id:    String,
  name:   String,
  artists: [],
  lastPlayedArtist: {
    name: String,
    song: String
  }
});

module.exports = User;
