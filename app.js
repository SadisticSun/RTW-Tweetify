/*jshint esversion: 6 */

// Dependencies
const express                     = require('express');
const path                        = require('path');
const bodyParser                  = require('body-parser');
const app                         = express();
const compression                 = require('compression');
const server                      = require('http').createServer(app);
const io                          = require('socket.io')(server);
const mongoose                    = require('mongoose');
const dotenv                      = require('dotenv').config();
var port                          = process.env.PORT || 8080;

// import models
const User                        = require('./models/user.js');

// import routes
const artistsRouter               = require('./routes/artists.js');
const indexRouter                 = require('./routes/index.js');
const loginRouter                 = require('./routes/login.js');

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

// Set empty arrays for connections and users
var CONNECTIONS = [];
var USERS = [];


// Connect to MongoDB
const mongoServer = 'mongodb://SadisticSun:inzichtenEN123@ds151631.mlab.com:51631/rtw'
mongoose.connect(mongoServer);

// Routes
app.use('', indexRouter);
app.use('/', loginRouter);
app.use('/', artistsRouter(io));

// Start Server
server.listen(port);

module.exports = app;
