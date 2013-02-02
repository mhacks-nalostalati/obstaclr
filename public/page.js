$(function() {
  var socket = io.connect(window.location.hostname);

  var fullPlayerList = [];
  var name;
  var designation;

  var splashMenu =  $(".splash-menu");
  var playerName = $('input[name=playerName]');
  var lobbyCount = $('#lobbyCount');
  var nextButton = $('#nextbutton');
  var friendsName = $('input[name=friendsName]');
  var gameStart = $("#game-start");
  var playButton = $('#play');
  var playersInLobby = $('#playersInLobby');

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

    designation = 0; //Currently defaulting to cartographer, 1 for player
    //todo: set designation based on interface something

    socket.emit('gameStart', vsName, name, newUrl, designation);
    window.history.pushState(null, newUrl, newUrl);

    playersInLobby.remove();
    gameStart.fadeOut('fast', function() {});
    gameplaySetup();
  });

  socket.on('invite', function (challenger, room, myDesignation) {

    designation = myDesignation; //designation 0 for cartographer, 1 for player

    socket.removeAllListeners("addPlayer");
    socket.removeAllListeners("removePlayer");

    //possibeTodo: accept invitation

    window.history.pushState(null, room, room);
    playersInLobby.remove();
    gameStart.fadeOut('fast', function() {});
    gameplaySetup();
  });

  var gameplaySetup = function(){

    //todo: Draw the game canvas

    if (designation == 0) { //if player is cartographer
      socket.emit('createLine', x1, x2, y1, y2, color);
       
      socket.emit('playerPositioned', x, y);
    }
    else if (designation == 0) { //if player is player
      socket.emit('playerPosition', x, y) 

      socket.on('lineCreated', x1, x2, y1, y2, color)
    }
  }

  //remove from everyone's list if they close the window
  $(window).on('beforeunload', function(){
    if (name) {
      socket.emit('playerGone', name);
      return 'please dont leave';
    }
  });

  function playerHasWon(){

  }
  function obstaclrHasWon(){

  }

  //actual gameplay shit goes here
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
  function drawLineNode(context, color, x, y){
    context.fillStyle = color;
    context.beginPath();
    context.arc(x,y,5,0,Math.PI*2,true);
    context.closePath();
    context.fill();
  }
  function drawLine(context, color, x1, y1, x2, y2){
    drawLineNode(context, color, x1, y1);
    drawLineNode(context, color, x2, y2);
    context.beginPath();
    context.moveTo(x1,y1);
    context.lineTo(x2,y2);
    context.strokeStyle = color;
    context.lineWidth = 10;
    context.stroke();

  }
  function clear(context){
    context.clearRect(0, 0, 1200, 400);
  }
  if(false && isPlayer){
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
      if(playerX > 590){
        clearInterval();
        playerHasWon();
        return;
      }
      if(playerX < 10){
        clearInterval();
        obstaclrHasWon();
      }
      clear(ctx);
      player(playerX, playerY);
      if(upPressed && !downPressed && playerY > 11) playerY -= playerDY;
      if(downPressed && !upPressed && playerY < 389) playerY += playerDY;
      playerX += playerDX
    }
    setInterval(draw, 10);
  }
  else if(true || isObstaclr){
    var drawzone = $("#drawzone");
    var drawctx = drawzone[0].getContext('2d');
    var lineStatus = { x1: 0, y2: 0, isStarted: false, color: "#000"}
    var paints = {black: 100, blue: 100, yellow: 100};
    var bluecounter = $('#bluecounter');
    var yellowcounter = $('#yellowcounter');
    setInterval(function(){
      if(paints.blue < 100){ paints.blue ++; bluecounter.html(paints.blue);};
      if(paints.yellow < 100){ paints.yellow ++; yellowcounter.html(paints.yellow);};

    }, 100);
    var blackcounter = $("#blackcounter");
    setInterval(function(){
      if(paints.black < 100){ paints.black ++; blackcounter.html(paints.black)};
    }, 200);
    var ymax = 200;
    function selectColor(color){
      if(color < 0){
        //black as fuck
        lineStatus.color = '#000';
        $(".buttons button").removeClass('selected');
        $('#blackpaintbutton').addClass('selected');
      }
      else if(color >0){
        lineStatus.color = '#0b61a4';
        $(".buttons button").removeClass('selected');
        $('#bluepaintbutton').addClass('selected');
      }
      else{
        lineStatus.color = '#ffbf00';
        $(".buttons button").removeClass('selected');
        $('#yellowpaintbutton').addClass('selected');
      }
    }
    $(document).keydown(function(e){
      if(e.keyCode == 65) selectColor(-1);
      if(e.keyCode == 83) selectColor(1);
      if(e.keyCode == 68) selectColor(0);
    });
    $("#blackpaintbutton").click(function(e){selectColor(-1)});
    $("#bluepaintbutton").click(function(e){selectColor(1)});
    $("#yellowpaintbutton").click(function(e){selectColor(0)});
    drawzone.on("click", function(e){
      if(lineStatus.isStarted){
        var y = (Math.abs(e.offsetY - lineStatus.y1) < ymax) ? e.offsetY : lineStatus.y1 + ((e.offsetY - lineStatus.y1)/Math.abs(e.offsetY - lineStatus.y1))*ymax;
        clear(drawctx);
        drawLine(ctx, lineStatus.color, lineStatus.x1 + 795, lineStatus.y1, e.offsetX + 795,y);
        lineStatus.isStarted = false;
      }
      else{
        lineStatus.x1 = e.offsetX; //add 800 when drawing to the main canvas
        lineStatus.y1 = e.offsetY;
        lineStatus.isStarted = true;
      }
    });
    drawzone.on('mousemove', function(e){
      if(!lineStatus.isStarted) return;
      clear(drawctx);
      var y = (Math.abs(e.offsetY - lineStatus.y1) < ymax) ? e.offsetY : lineStatus.y1 + ((e.offsetY - lineStatus.y1)/Math.abs(e.offsetY - lineStatus.y1))*ymax;
      drawLine(drawctx,lineStatus.color, lineStatus.x1, lineStatus.y1, e.offsetX, y); 
    });

  }
});
