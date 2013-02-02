var express = require('express');
var app = express();
  // , io = require('socket.io').listen(app)
  // , fs = require('fs')

app.listen(3000);

// io.sockets.on('connection', function (socket) {
//   socket.emit('news', { hello: 'world' });
//   socket.on('my other event', function (data) {
//     console.log(data);
//   });
// });

app.get('/', function(req, res){
  res.send('Hello World');
});