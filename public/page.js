$(function() {

  var socket = io.connect(window.location.hostname);

  var fullPlayerList = [];

  var splashMenu =  $(".splash-menu");
  var playerName = $('input[name=playerName]');
  var nextButton = $('#nextbutton');
  var friendsName = $('input[name=friendsName]');

  nextButton.click(function() {
    splashmenu.remove();
    var enteredName = playerName.val();
    enteredName = enteredName.replace(/\s/g, "");
    enteredName = enteredName.toLowerCase();
    playerName.val(enteredName);
    socket.emit('newPlayer', enteredName);
  });

  socket.on('fullList', function (playerList) {
    fullPlayerList = playerList;
    friendsName.autocomplete({
      source: fullPlayerList;
    });
  });

  socket.on('addPlayer', function (name) {
    fullPlayerList.push(name);
    friendsName.autocomplete({
      source: fullPlayerList;
    });
  });

  socket.on('removePlayer', function (name) {
    fullPlayerList.splice(playerlist.indexOf(name), 1);
    friendsName.autocomplete({
      source: fullPlayerList;
    });
  });

});