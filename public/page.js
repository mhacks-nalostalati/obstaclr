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

  //actual gameplay goes here
  if(false && clientIsPlayer){
    
  }
  else{
    
  }
  function playerHasWon(){

  }
  function obstaclrHasWon(){

  }
  var ctx = $('#canvas')[0].getContext('2d');

  //player
  function player(x,y){
    ctx.fillStyle = "#ff4900";
    ctx.beginPath();
    ctx.arc(x,y,10,0,Math.PI*2, true);
    ctx.closePath();
    ctx.fill();
  }
  player(10, 200);
  //clearshit
  function clear(){
    ctx.clearRect(0, 0, 1200, 400);
  }
  var playerDX = .1;
  var playerX = 10;
  var playerY = 200;
  var playerDY = 3;
  upPressed = false;
  downPressed = false;

  //set rightDown or leftDown if the right or left keys are down
  function onKeyDown(e) {
      if (e.keyCode == 38) upPressed = true;
      else if (e.keyCode == 40) downPressed = true;
  }

  //and unset them when the right or left key is released
  function onKeyUp(e) {
      if (e.keyCode == 38) upPressed = false;
      else if (e.keyCode == 40) downPressed = false;
  }

  $(document).keydown(onKeyDown);
  $(document).keyup(onKeyUp);
  function draw(){
    if(playerX > 599){
      clearInterval();
      playerHasWon();
      return;
    }
    if(playerX < 10){
      clearInterval();
      obstaclrHasWon();
    }
    clear();
    player(playerX, playerY);
    if(upPressed && !downPressed && playerY > 11) playerY -= playerDY;
    if(downPressed && !upPressed && playerY < 389) playerY += playerDY;
    playerX += playerDX
  }
  setInterval(draw, 10);

});
