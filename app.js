var express = require('express');

var app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server)
  , stylus = require('stylus')
  , nib = require('nib')
  , path = require('path')
  , jade = require('jade')

function compile(str, path) {
  return stylus(str)
    .set('filename', path)
    .set('compress', true)
    .use(nib());
}

app.configure(function() {
  app.set('port', process.env.PORT || 3000);
  app.use(express.favicon());
  app.use(app.router);
  app.set("view options", {layout: false});
  app.use(stylus.middleware({
    src: __dirname + '/public'
    , compile: compile}));
  app.use(express.static(__dirname + '/public'));
  app.set("view options", {layout: false});
  // app.engine('html', jade.renderFile);
});

// Heroku won't actually allow us to use WebSockets
// so we have to setup polling instead.
// https://devcenter.heroku.com/articles/using-socket-io-with-node-js-on-heroku
io.configure(function () {
  io.set("transports", ["xhr-polling"]);
  io.set("polling duration", 10);
});

var playerlist = [];

io.sockets.on('connection', function (socket) {
  
  //give current list on connection
  io.sockets.emit('fullList', playerlist);

  //when a player enters their name in the first window
  socket.on('newPlayer', function (name) {
    if (!(playerlist.indexOf(name) == -1)) {
      console.log (name + " already exists");
      return;
    }
    playerlist.push(name);
    console.log (name + " added to list");
    io.sockets.emit('addPlayer', { name: name });
  });

  //when a player exits window or starts playing
  socket.on('playerGone', function (name) {
    if (playerlist.indexOf(name) == -1) {
      console.log (name + " does not exist");
      return;
    }
    playerlist.splice(playerlist.indexOf(name), 1);
    console.log (name + " removed from list");
    io.sockets.emit('removePlayer', { name: name });
  });

  //when a line gets created
  socket.on('lineMade', function (x, y1, y2, color) {
    // io.sockets.emit('createLine', {});
  });

  //updating the player position



});

app.get('/', function(req, res){
  res.sendfile('public/page.html');
});

server.listen(app.get('port'));
console.log('server now listening on port ' + app.get('port'));
