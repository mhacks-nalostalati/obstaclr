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
  if (yPos > this.point1.y && yPos < this.point2.y || yPos < this.point1.y && yPos > this.point2.y)
    return 1;
  else return 0;
}

Edge.prototype.relativeX = function(xPos, yPos) {
  if (this.inY(yPos) == 1) {
    var lineXPos = (yPos - this.point1.y)*(this.run)/(this.rise) + this.point1.x;
    if (xPos > lineXPos) return 1;
    else if (xPos < lineXPos) return -1;
    else if (xPos == lineXPos) return 0;
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

Rectangle.prototype.moveLeft = function(left) {
  this.baseLine.point1.x -= left;
  this.baseLine.point2.x -= left;
  this.rectFromLine();
}

Rectangle.prototype.collision = function(ballPoint) {
  var x = ballPoint.x;
  var y = ballPoint.y;
  console.log(this.edge1.relativeX(x, y) + ', ' + this.edge2.relativeX(x, y) + ', ' + this.edge3.relativeX(x, y) + ', ' + this.edge4.relativeX(x, y));
  if (this.edge1.relativeX(x, y) + this.edge2.relativeX(x, y) + this.edge3.relativeX(x, y) + this.edge4.relativeX(x, y) == -10)
    return true;
  else return false;
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
    var Point1 = new Point1(X1, Y1);
    var Point1 = new Point2(X2, Y2);
    var thisLine = new Edge(Point1, Point2, Color);
    var thisRect = new Rectangle(thisLine, halfWidth);

    if (!lines.currentRoom) lines.currentRoom = [];
    lines.currentRoom.push(thisRect);
  });

  socket.on('playerPosition', function(x, y, currentRoom) {
    var myPlayer = new Point(x,y);
    if (lines.currentRoom) {
      var i = lines.currentRoom.length;
      while (i--) {
        var currentRect = lines.currentRoom[i];
        currentRect.moveLeft(10);
        if (myRect.collision(myPlayer)) {
          if (myRect.baseLine.color < 0) console.log('collision with color -1');
          else if (myRect.baseLine.color > 0) console.log('collision with color 1');
          else console.log('collision with color 0');
        }
        else console.log('not a collision'); 
      }
    }

    myPlayer.x += 0.1;
    io.sockets.in(currentRoom).emit('updateCanvas', lines.currentRoom, myPlayer);

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
