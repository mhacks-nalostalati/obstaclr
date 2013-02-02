$(function() {
  var socket = io.connect(window.location.hostname);

  var fullPlayerList = [];
  var name;
  var designation;
  var currentRoom;

  var splashMenu =  $(".splash-menu");
  var playerName = $('input[name=playerName]');
  var lobbyCount = $('#lobbyCount');
  var nextButton = $('#nextbutton');
  var friendsName = $('input[name=friendsName]');
  var gameStart = $("#game-start");
  var playButton = $('#play');
  var playersInLobby = $('#playersInLobby');
  var gamebox = $('.game-box');

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
    gameStart.show();
  });

      $("#mapper").click(function(){
        designation = 0;
        $("#mapper").css("color", "#ff4900");
        $("#player").css("color", "black");
        
    });

    $("#player").click(function(){
      designation = 1;
      $("#player").css("color", "#ff4900");
      $("#mapper").css("color", "black");
    });

    //when they click accept on the invite
    $("#accept").click(function(){
      $("#invitepage").hide();
      gameplaySetup();
      $("#accept").css("color", "#ff4900");
    });

  //when they click the play button
  playButton.click(function() {

    var vsName = friendsName.val().toLowerCase();
    friendsName.val(vsName);
    if (fullPlayerList.indexOf(vsName) == -1) return;

    socket.emit('playerGone', name)
    socket.removeAllListeners("addPlayer");
    socket.removeAllListeners("removePlayer");

    if (vsName < name) var room = '/' + vsName + 'vs' + name;
    else var currentRoom = '/' + name + 'vs' + vsName;

    socket.emit('gameStart', vsName, name, currentRoom, designation);
    window.history.pushState(null, currentRoom, currentRoom);

    playersInLobby.remove();
    
    gameStart.hide();
    gameplaySetup();
  });

  socket.on('invite', function (challenger, room, myDesignation) {

    designation = myDesignation; //designation 0 for cartographer, 1 for player
    currentRoom = room; //sets the global room to send with each request, quicker than a hash lookup

    socket.removeAllListeners("addPlayer");
    socket.removeAllListeners("removePlayer");

  
    //possibeTodo: accept invitation
    playersInLobby.remove();
    gameStart.hide();
    $("#invitepage").show();
    var replacename = $("#name").html().replace("name", challenger);
    $("#name").html(replacename);
    
    var role;

    if (myDesignation == 1){
      role = "player"}
    else {
      role = "mapper"
    }

    var replacerole = $("#role").html().replace("role", role);
    $("#role").html(replacerole);
    
    window.history.pushState(null, room, room);
    //gameplaySetup();
  });

  var gameplaySetup = function(){

    //todo: Draw the game canvas, show gamebox
    gamebox.show();

    if (designation == 0) { //if player is cartographer
      
      var lineToServer = function(x1, x2, y1, y2, color) {
        socket.emit('createLine', x1, x2, y1, y2, color, currentRoom);
      }

      // socket.on('playerPositioned', x, y) {};
      //   //position the player for the cartographer baesd on server
      // }; 

    }

    else if (designation == 1) { //if player is player
      
      var positionToServer = function(x, y) {
        socket.emit('playerPosition', x, y, currentRoom)
      }
      
      // socket.on('lineCreated', x1, x2, y1, y2, color) {
      //   //create lines for player based on socket
      // }

    }
  }

  //remove from everyone's list if they close the window
  $(window).on('beforeunload', function(){
    if (gamebox.is(":visible")) {
      socket.emit('playerExit', currentRoom);
      return name + ', you have left the game';
    }
    else if (name) {
      socket.emit('playerGone', name);
      return name + ', we are sorry to see you go';
    }
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
