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
    //validation to ensure user enters a name
    if (name == '' || typeof name =='undefined'){
      $("#namevalidation").css("display", "block");
    }
    else {
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
    }
  });


      //when user selects role of mapper
      $("#mapper").click(function(){
        designation = 0;
        $("#mapper").css("color", "#ff4900");
        $("#player").css("color", "black");
        
    });

    //when user selects role of player
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
    
    //validation to ensure user chooses a role
    if (designation == undefined){
      $("#rolevalidation").css("display", "block");
    }

    else if (typeof vsName == undefined || vsName == '' || vsName == null){
      $("#friendnamevalidation").css("display", "block");
    }

    socket.emit('invitePlayer', vsName, name, currentRoom, designation)

  });

  socket.on('accepted', function (vsName) {
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

  })

  socket.on('invite', function (challenger, room, myDesignation) {
    designation = myDesignation; //designation 0 for cartographer, 1 for player
    currentRoom = room; //sets the global room to send with each request, quicker than a hash lookup

    socket.removeAllListeners("addPlayer");
    socket.removeAllListeners("removePlayer");

    playersInLobby.remove();
    gameStart.hide();

    //possibeTodo: accept invitation
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
    if (gamebox.is(":visible")) {
      socket.emit('playerExit', currentRoom);
      return name + ', you have left the game';
    }
    else if (name) {
      socket.emit('playerGone', name);
      return name + ', we are sorry to see you go';
    }
  });

  function playerHasWon(){
    if (designation == 0){
      $("#losepage").show();
    }
    else if (designation == 1){
      $("#playerwinpage").show();
    }
  }
  function obstaclrHasWon(){
    if (designation == 0){
      $("#obstaclrwinpage").show();
    }
    else if (designation == 1){
      $("#yolopage").show();
    }
  }

  socket.on('opponentQuit', function() {
    $("#quitpage").show();
  })

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

  if(designation > 0){
    var playerDX = .1;
    var playerX = 10;
    var playerY = 200;
    var playerDY = 5;
    upPressed = false;
    downPressed = false;
  
    function onKeyDown(e) {
      if (e.keyCode == 38) upPressed = true;
      else if (e.keyCode == 40) downPressed = true;
    }
    function onKeyUp(e) {
      if (e.keyCode == 38) upPressed = false;
      else if (e.keyCode == 40) downPressed = false;
    }
    $(document).keydown(onKeyDown);
    $(document).keyup(onKeyUp);
    socket.on('updateCanvas', function(lines, player){
      if(player.x > 590){
        playerHasWon();
        return;
      }
      if(player.x < 10){
        obstaclrHasWon();
      }
      reqAnimFrame = window.mozRequestAnimationFrame    ||
        window.webkitRequestAnimationFrame ||
        window.msRequestAnimationFrame     ||
        window.oRequestAnimationFrame;
      reqAnimFrame(this);
      if(upPressed && !downPressed && playerY > 11) playerY = player.y - playerDY;
      if(downPressed && !upPressed && playerY < 389) playerY = player.y +  playerDY;
      clear(ctx);
      player(player.x, playerY);
    });
    /*
    function animate(timestamp){
      timestamp = timestamp || Date.now();
      if(playerX > 590){
        clearInterval();
        playerHasWon();
        return;
      }
      if(playerX < 10){
        clearInterval();
        obstaclrHasWon();
      }
      reqAnimFrame = window.mozRequestAnimationFrame    ||
        window.webkitRequestAnimationFrame ||
        window.msRequestAnimationFrame     ||
        window.oRequestAnimationFrame;
      reqAnimFrame(animate);
      if(upPressed && !downPressed && playerY > 11) playerY -= playerDY;
      if(downPressed && !upPressed && playerY < 389) playerY += playerDY;
      playerX += playerDX;//(595 * timestamp)/120000;
      clear(ctx);
      player(playerX, playerY);
    }
    animate();
    */
  }
  else if(designation < 1){
    var drawzone = $("#drawzone");
    var drawctx = drawzone[0].getContext('2d');
    var lineStatus = { x1: 0, y2: 0, isStarted: false, color: "#000"};
    var paints = {"#000": 100, "#0b61a4": 100, "#ffbf00": 100};
    var bluecounter = $('#bluecounter');
    var yellowcounter = $('#yellowcounter');
    setInterval(function(){
      if(paints["#0b61a4"] < 100){ paints["#0b61a4"] ++; bluecounter.html(paints["#0b61a4"]);};
      if(paints["#ffbf00"] < 100){ paints["#ffbf00"] ++; yellowcounter.html(paints["#ffbf00"]);};
    }, 100);
    var blackcounter = $("#blackcounter");
    setInterval(function(){
      if(paints["#000"] < 100){ paints["#000"] ++; blackcounter.html(paints["#000"])};
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
    selectColor(-1);
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
        var color = -1;
        //TODO: make sure there actually is enough paint!
        if(lineStatus.color == "#0b61a4") color = 1;
        if(lineStatus.color == "#ffbf00") color = 0;
        socket.emit('createLine', lineStatus.x1 + 795, e.offsetX + 795, lineStatus.y1, y,color, currentRoom);
        //drawLine(ctx, lineStatus.color, lineStatus.x1 + 795, lineStatus.y1, e.offsetX + 795,y);
        var length = Math.sqrt(Math.pow((e.offsetX - lineStatus.x1),2) + Math.pow((y - lineStatus.y1),2));
        paints[lineStatus.color] -= Math.floor(length/5);
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
