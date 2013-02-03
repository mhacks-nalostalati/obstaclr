var express = require('express');

var app = express(),
  http = require('http'),
  server = http.createServer(app),
  io = require('socket.io').listen(server),
  stylus = require('stylus'),
  nib = require('nib'),
  path = require('path'),
  jade = require('jade');

function compile(str, path) {
  return stylus(str)
    .set('filename', path)
    .set('compress', true)
    .use(nib());
}
  
var Point = function(X, Y) {
  this.x = X;
  this.y = Y;
}

var Edge = function(Point1, Point2, Color) {
  this.point1 = Point1;
  this.point2 = Point2;
  this.color = Color;

  this.run = (this.point2.x-this.point1.x);
  this.rise = (this.point2.y-this.point1.y);
  this.theta = Math.atan2(this.rise,this.run);
}

Edge.prototype.inY = function(yPos) {
  if ((yPos > (this.point1.y-2) && yPos < (this.point2.y+2)) || (yPos < (this.point1.y+2) && yPos > (this.point2.y-2))) return true;
  return false;
}

Edge.prototype.inX = function(xPos) {
  if ((xPos > (this.point1.x - 2)  && xPos < (this.point2.x + 2)) || (xPos < (this.point1.x + 2) && xPos > (this.point2.x - 2))) return true;
  return false;
}

Edge.prototype.relativeX = function(xPos, yPos) {
  if (this.inY(yPos) && this.inX(xPos)) {
    var distance = xPos - ((yPos - this.point1.y)*(this.run)/(this.rise) + this.point1.x);
    if (distance < -2) return -1;
    else if (distance > 2) return 1;
    return 0;
  }
  else return -5;
}

var Rectangle = function(line, Width) {
  this.baseLine = line;
  this.width = Width;
  this.rectFromLine();
}

Rectangle.prototype.rectFromLine = function() {
  X1 = parseFloat(this.baseLine.point1.x);
  Y1 = parseFloat(this.baseLine.point1.y);
  X2 = parseFloat(this.baseLine.point2.x);
  Y2 = parseFloat(this.baseLine.point2.y);
  halfWidth = parseFloat(this.width);

  var fatX = halfWidth*Math.sin(this.baseLine.theta);
  var fatY = halfWidth*Math.cos(this.baseLine.theta);

  this.rect1 = new Point((X1 - fatX),(Y1 + fatY));
  this.rect2 = new Point((X1 + fatX),(Y1 - fatY));
  this.rect3 = new Point((X2 + fatX),(Y2 - fatY));
  this.rect4 = new Point((X2 - fatX),(Y2 + fatY));

  this.edge1 = new Edge(this.rect1, this.rect2, null);
  this.edge2 = new Edge(this.rect2, this.rect3, null);
  this.edge3 = new Edge(this.rect3, this.rect4, null);
  this.edge4 = new Edge(this.rect4, this.rect1, null);
}

Rectangle.prototype.isOffScreen = function() {
  if (this.baseLine.point1.x < 0 && this.baseLine.point2.x < 0) return true;
  return false;
}

Rectangle.prototype.moveLeft = function(left) {
  this.baseLine.point1.x -= left;
  this.baseLine.point2.x -= left;
  this.rectFromLine();
}

Rectangle.prototype.collision = function(ballPoint) {

  var x = ballPoint.x;
  var y = ballPoint.y;

  var pos1 = this.edge1.relativeX(x, y),
      pos2 = this.edge2.relativeX(x, y),
      pos3 = this.edge3.relativeX(x, y),
      pos4 = this.edge4.relativeX(x, y),
      product = pos1*pos2*pos3*pos4;

  if (product === 0 || product === 25) return true;
  return false;
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
var players = {};
var intervals = {};

io.sockets.on('connection', function (socket) {
  
  //give current list on connection
  clients[socket.id] = socket;
  io.sockets.socket(socket.id).emit('fullList', playerlist);

  //when a player enters their name in the first window
  socket.on('newPlayer', function (name) {
    if (!(playerlist.indexOf(name) == -1)) return;

    playerlist.push(name);
    clientlist.push(socket.id);
    socket.broadcast.emit('addPlayer', name);

  });

  //when a player exits window or starts playing
  socket.on('playerGone', function (name) {
    if (playerlist.indexOf(name) == -1) return;

    var position = playerlist.indexOf(name);
    playerlist.splice(position, 1);
    clientlist.splice(position, 1);
    socket.broadcast.emit('removePlayer', name);

  });

  socket.on('invitePlayer', function (opponent, challenger, room, designation) {
    var position = playerlist.indexOf(opponent);
    var invitee = clients[clientlist[position]];
    invitee.emit('invite', challenger, room, (1 - designation));
  });

  socket.on('playerAccepts', function (acceptor, challenger, room) {
    var position = playerlist.indexOf(challenger);
    var challengingPlayer = clients[clientlist[position]];

    socket.join(room);
    challengingPlayer.join(room);

    playerlist.splice(position, 1);
    clientlist.splice(position, 1);

    challengingPlayer.broadcast.emit('removePlayer', challenger);
    socket.broadcast.emit('removePlayer', acceptor);
    challengingPlayer.emit('accepted', acceptor, room)

    lines[room] = [];
    players[room] = new Point(10,200);
    
    intervals[room] = setInterval (function() {

      var myPlayer = players[room];

      if (lines[room]) {
        var i = lines[room].length;
        while (i--) {
          if(lines[room][i]){
            var currentRect = lines[room][i];
            if (currentRect.isOffScreen) {lines[room].splice(i,1)}
            else {
              currentRect.moveLeft(1.5);
              if (currentRect.collision(myPlayer)) {
                if (currentRect.baseLine.color < 0) io.sockets.in(room).emit('playerDeath');
                else if (currentRect.baseLine.color > 0) myPlayer.x -= 1.2;
                else myPlayer.x -= 7.5;
              }
            }
          }
        }
      }
      
      myPlayer.x += 0.3; 
      io.sockets.in(room).emit('updateCanvas', lines[room], players[room]);

    }, 30);

  });

  socket.on('createLine', function(X1, X2, Y1, Y2, Color, currentRoom) {
    var Point1 = new Point(X1, Y1);
    var Point2 = new Point(X2, Y2);
    var thisLine = new Edge(Point1, Point2, Color);
    var thisRect = new Rectangle(thisLine, 7);
    lines[currentRoom].push(thisRect);
  });

  socket.on('playerPosition', function(x, y, currentRoom) {
    players[currentRoom].x = x;
    players[currentRoom].y = y;
  });

  socket.on('playerExit', function(currentRoom) {
    socket.broadcast.to(currentRoom).emit('opponentQuit');
  });
  
});


app.get('/', function(req, res){
  res.render('page.jade');
});

server.listen(app.get('port'));
