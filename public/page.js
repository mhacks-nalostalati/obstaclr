$(function() {


  var socket = io.connect(window.location.hostname);

  var fullPlayerList = [];
  var name;

  var splashMenu =  $(".splash-menu");
  var playerName = $('input[name=playerName]');
  var lobbyCount = $('#lobbyCount');
  var nextButton = $('#nextbutton');
  var friendsName = $('input[name=friendsName]');
  var gameStart = $("#game-start");
  var playButton = $('#play');

  //Populate list of current players on connection
  socket.on('fullList', function (playerList) {
    fullPlayerList = playerList;
    lobbyCount.text(fullPlayerList.length);
    friendsName.autocomplete({
      source: fullPlayerList
    });
  });

  //Add to list everytime a player joins
  socket.on('addPlayer', function (name) {
    fullPlayerList.push(name);
    lobbyCount.text(fullPlayerList.length);
    friendsName.autocomplete({
      source: fullPlayerList
    });
  });

  //remove from list everytime a player leaves
  socket.on('removePlayer', function (name) {
    fullPlayerList.splice(fullPlayerList.indexOf(name), 1);
    lobbyCount.text(fullPlayerList.length);
    friendsName.autocomplete({
      source: fullPlayerList
    });
  });


  socket.on('invite', function (challenger, room) {
    socket.removeAllListeners("addPlayer");
    socket.removeAllListeners("removePlayer");

    //possibeTodo: accept invitation

    window.history.pushState(null, room, room);
    gameStart.fadeOut('fast', function() {});
    //todo: go to game as player
  });

  
  socket.on('linecreated', function (x1, x2, y1, y2, color) {

  });


  //format and add the name when they come in
  nextButton.click(function() {
    name = playerName.val();
    name = name.replace(/\s/g, "");
    name = name.toLowerCase();
    playerName.val(name);
    if (!(fullPlayerList.indexOf(name) == -1)) {
      nextButton.prev().prev().prev().prev().text('Taken, try again');
      return;
    }
    socket.emit('newPlayer', name);
    splashMenu.remove();
    gameStart.fadeIn('fast', function() {});
  });

  //when they click the play button
  playButton.click(function() {

    var vsName = friendsName.val().toLowerCase();
    friendsName.val(vsName);
    if (fullPlayerList.indexOf(vsName) == -1) return;

    socket.emit('playerGone', name)
    socket.removeAllListeners("addPlayer");
    socket.removeAllListeners("removePlayer");

    if (vsName < name) var newUrl = '/' + vsName + 'vs' + name;
    else var newUrl = '/' + name + 'vs' + vsName;

    socket.emit('gameStart', vsName, name, newUrl);
    window.history.pushState(null, newUrl, newUrl);

    gameStart.fadeOut('fast', function() {});
    //todo: go to game as cartographer
  });

  //remove from everyone's list if they close the window
  $(window).on('beforeunload', function(){
    if (name) {
      socket.emit('playerGone', name);
      return 'please dont leave';
    }
  });

});