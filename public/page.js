$(function() {


  var socket = io.connect(window.location.hostname);

  var fullPlayerList = [];
  var name;

  var splashMenu =  $(".splash-menu");
  var playerName = $('input[name=playerName]');
  var nextButton = $('#nextbutton');
  var friendsName = $('input[name=friendsName]');
  var gameStart = $("#game-start");

  nextButton.click(function() {
    name = playerName.val();
    name = name.replace(/\s/g, "");
    name = name.toLowerCase();
    playerName.val(name);
    socket.emit('newPlayer', name);
    splashMenu.remove();
    gameStart.fadeIn('fast', function() {});
  });

  socket.on('fullList', function (playerList) {
    fullPlayerList = playerList;
    friendsName.autocomplete({
      source: fullPlayerList
    });
  });

  socket.on('addPlayer', function (name) {
    fullPlayerList.push(name);
    friendsName.autocomplete({
      source: fullPlayerList
    });
  });

  socket.on('removePlayer', function (name) {
    fullPlayerList.splice(fullPlayerList.indexOf(name), 1);
    friendsName.autocomplete({
      source: fullPlayerList
    });
  });

  $(window).unload(function() {
    if (name) {
      socket.emit('playerGone', name)
    };
  });

});