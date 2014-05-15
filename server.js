// INCLUDE MODULES =======================================================
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var Twig = require('twig');
var twig = Twig.twig;
var path = require('path');
var json = require('json');
var mongoose = require('mongoose');
var flash 	 = require('connect-flash');
var connect = require('connect');

var configDB = require('./config/database.js');

// Assets ================================================================
app.use(express.static(path.join(__dirname, 'public')));
connect()
.use(require('compression')())
.use(connect.session({ secret: 'keyboard cat', cookie: { maxAge: 60000 }}))
.use(connect.cookieParser('optional secret string'))
  .use(function(req, res, next){
    res.end(JSON.stringify(req.cookies));
  })
.use(require('cookie-session')({
  keys: ['secret1', 'secret2']
}))
.use(require('body-parser')())
.use(connect.favicon(path.join(__dirname, 'public/images/favicon.ico')))
.use(connect.logger('dev'))
.use(function(req, res){
  res.end('Hello from Connect!\n');
});

// Start mongoose
mongoose.connect(configDB.url);

// ROUTES =======================================================
require('./app/routes.js')(app);

//ERROR MANAGEMENT =======================================================
app.use(function(req, res, next){
  res.status(404);

  // respond with html page
  if (req.accepts('html')) {
    res.render('errors/404.twig', { url: req.url });
    return;
  }
  // respond with json
  if (req.accepts('json')) {
    res.send({ error: 'Not found' });
    return;
  }
  // default to plain-text. send()
  res.type('txt').send('Not found');
});
/*app.use(function(err, req, res, next){
  // we may use properties of the error object
  // here and next(err) appropriately, or if
  // we possibly recovered from the error, simply next().
  res.status(err.status || 500);
  res.render('errors/500.twig', { error: err });
});*/

//SOCKET IO =======================================================
//Quand on client se connecte, on le note dans la console
var clients = {};
var socketsOfClients = {};
io.sockets.on('connection', function(socket) {
  socket.on('set username', function(userName) {
    // Is this an existing user name?
    if (clients[userName] === undefined) {
      // Does not exist ... so, proceed
      clients[userName] = socket.id;
      socketsOfClients[socket.id] = userName;
      userNameAvailable(socket.id, userName);
      userJoined(userName);
    } else
    if (clients[userName] === socket.id) {
      // Ignore for now
    } else {
      userNameAlreadyInUse(socket.id, userName);
    }
  });
  socket.on('message', function(msg) {
    var srcUser;
    if (msg.inferSrcUser) {
      // Infer user name based on the socket id
      srcUser = socketsOfClients[socket.id];
    } else {
      srcUser = msg.source;
    }
 
    if (msg.target == "All") {
      // broadcast
      io.sockets.emit('message',
          {"source": srcUser,
           "message": msg.message,
           "target": msg.target});
    } else {
      // Look up the socket id
      io.sockets.sockets[clients[msg.target]].emit('message',
          {"source": srcUser,
           "message": msg.message,
           "target": msg.target});
    }
  })
  socket.on('disconnect', function() {
    var uName = socketsOfClients[socket.id];
    delete socketsOfClients[socket.id];
    delete clients[uName];
 
    // relay this message to all the clients
 
    userLeft(uName);
  })
})

function userJoined(uName) {
    Object.keys(socketsOfClients).forEach(function(sId) {
      io.sockets.sockets[sId].emit('userJoined', { "userName": uName });
    })
}
 
function userLeft(uName) {
    io.sockets.emit('userLeft', { "userName": uName });
}
 
function userNameAvailable(sId, uName) {
  setTimeout(function() {
 
    console.log('Sending welcome msg to ' + uName + ' at ' + sId);
    io.sockets.sockets[sId].emit('welcome', { "userName" : uName, "currentUsers": JSON.stringify(Object.keys(clients)) });
 
  }, 500);
}
 
function userNameAlreadyInUse(sId, uName) {
  setTimeout(function() {
    io.sockets.sockets[sId].emit('error', { "userNameInUse" : true });
  }, 500);
}

// LISTEN SERVER =======================================================
server.listen(80);