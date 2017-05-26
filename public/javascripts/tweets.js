(function() {
  'use strict';

  var socket = io();
  var tweetsContainer = document.getElementById('tweets');

  socket.on('tweet', function(data) {
    console.log('New tweet: ' + data);
    var newItem = document.createElement("P");
    var textnode = document.createTextNode(data.text);
    newItem.appendChild(textnode);
    newItem.classList.add("tweet", "animated", "fadeInDown");
    tweetsContainer.insertBefore(newItem, tweetsContainer.childNodes[0]);

  });

}());
