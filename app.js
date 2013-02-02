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
  app.set('views', __dirname + '/public');
  app.set('view engine', 'jade');
  app.set("view options", {layout: false});
  app.use(stylus.middleware({
    src: __dirname + '/public'
    , compile: compile}));
  app.use(express.static(__dirname + '/public'));
});

// Heroku won't actually allow us to use WebSockets
// so we have to setup polling instead.
// https://devcenter.heroku.com/articles/using-socket-io-with-node-js-on-heroku
io.configure(function () {
  io.set("transports", ["xhr-polling"]);
  io.set("polling duration", 10);
  io.set('log level', 1);
});

var playerlist = [];
var clientlist = [];
var clients = {};

var lines = {};

io.sockets.on('connection', function (socket) {
  
  //give current list on connection
  clients[socket.id] = socket;
  io.sockets.socket(socket.id).emit('fullList', playerlist);
  console.log ("sent a list of " + playerlist.length + " players to " + socket.id);

  //when a player enters their name in the first window
  socket.on('newPlayer', function (name) {
    if (!(playerlist.indexOf(name) == -1)) {
      console.log (name + " already exists, error from " + socket.id);
      return;
    }

    playerlist.push(name);
    clientlist.push(socket.id);

    console.log (name + " added to list from " + socket.id);
    socket.broadcast.emit('addPlayer', name);
  });

  //when a player exits window or starts playing
  socket.on('playerGone', function (name) {
    if (playerlist.indexOf(name) == -1) {
      console.log (name + " does not exist, error from " + socket.id);
      return;
    }

    var position = playerlist.indexOf(name);
    playerlist.splice(position, 1);
    clientlist.splice(position, 1);

    console.log (name + " removed from list from " + socket.id);
    socket.broadcast.emit('removePlayer', name);
  });

  socket.on('gameStart', function (opponent, challenger, room, designation) {
    var position = playerlist.indexOf(opponent);
    var invitee = clients[clientlist[position]];
    invitee.emit('invite', challenger, room, (1 - designation));

    socket.join(room);
    invitee.join(room);

    playerlist.splice(position, 1);
    clientlist.splice(position, 1);

    console.log (opponent + " removed from list with invite from " + socket.id);
    invitee.broadcast.emit('removePlayer', opponent);
  });

  socket.on('createLine', function(X1, X2, Y1, Y2, Color, currentRoom) {

    //possibleTodo: check if line is valid under rules

    if (!lines.currentRoom) lines.currentRoom = [];

    run = Math.abs(X2-X1);
    rise = Math.abs(Y2-Y1);
    var theta = (run)? Math.tan(rise/run) : Math.PI/2;

    var thisLine = {
      x1: X1, 
      x2: X2, 
      y1: Y1, 
      y2: Y2, 
      dx: run,
      dy: rise,
      fatX: (dx/dy),
      fatY: (dy/dx),
      color: Color
    }

    lines.currentRoom.push(thisLine);

  });

  socket.on('playerPosition', function(x, y, currentRoom) {
    //move each line one in the x position
    //crash detection of player with lines
    //give back position of player and every line
    socket.emit('playerPositioned', x, y); //for everyone but player
    io.sockets.in(currentRoom).emit('lineCreated', x1, x2, y1, y2, color);
  });

  socket.on('playerExit', function(currentRoom) {
    socket.broadcast.to(currentRoom).emit('opponentQuit');
  });
     

});

app.get('/', function(req, res){
  res.render('page.jade');
});

// app.get('/:room', function(req, res){
//   //join the right room for spectating 
//   //socket.join(req.params.room)
// })

server.listen(app.get('port'));
console.log('server now listening on port ' + app.get('port'));
