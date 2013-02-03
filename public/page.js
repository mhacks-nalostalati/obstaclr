$(function() {
  var socket = io.connect(window.location.hostname);

  var fullPlayerList = [];
  var name;
  var designation = -1;
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
  var waitingPage = $("#waitmessage");
  var obstaclr = $("#mapper");
  var playerBox = $('#player');
  var acceptButton = $("#accept");
  var declineButton = $("#decline");
  var invitePage = $("#invitepage");
  var nameBox = $("#name");
  var roleBox = $("#role");
  var playerWinPage = $("#playerwinpage");
  var obstaclrWinPage = $("#obstaclrwinpage");
  var playerLosePage = $("#yolopage");
  var obstaclrLosePage = $("#losepage");
  var quitPage = $("#quitpage");
  var nameValidation = $("#namevalidation");
  var newMatchButton = $("#newmatch");
  var roleValidation = $("#rolevalidation");
  var friendNameValidation = $("#friendnamevalidation");
  var matchButton = $("#match");
  var noOpponentMessage = $("#noopponentmessage");
  var opponentMatch = $("#opponentmatch");
  var opponentName = $("#opponentname");
  var quitButton = $("#quit");
  var endPage = $(".endofgamepage");

  playerName.focus();

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
      nameValidation.show();
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
      if (fullPlayerList.length == 0){
        noOpponentMessage.show();
      }
      else{
        gameStart.show();
      }
    }
  });

  //when user selects role of obstaclr
  obstaclr.click(function(){
    designation = 0;
    obstaclr.css("color", "#ff4900");
    playerBox.css("color", "black");
  });

  //when user selects role of player
  playerBox.click(function(){
    designation = 1;
    playerBox.css("color", "#ff4900");
    obstaclr.css("color", "black");
  });

  //when they click accept on the invite
  acceptButton.click(function(){
    invitePage.hide();
    gameplaySetup();
    acceptButton.css("color", "#ff4900");
  });

  //when they click the play button
  playButton.click(function() {
    var vsName = friendsName.val().toLowerCase();
    friendsName.val(vsName);
    //validation to ensure user chooses a role
    if (designation === 'null' || typeof designation === 'undefined' || designation == '-1'){
      roleValidation.show(); 
      return;
    }

    else if (vsName == '' || typeof vsName =='undefined' || fullPlayerList.indexOf(vsName) == '-1'){
      friendNameValidation.show();
      return;
    }

    if (vsName < name) currentRoom = vsName + 'vs' + name;
    else currentRoom = name + 'vs' + vsName;

    socket.emit('invitePlayer', vsName, name, currentRoom, designation);
    gameStart.hide();
    waitingPage.show();
  });

  matchButton.click(function() {
    var randomOpponent = fullPlayerList[Math.floor(Math.random()*fullPlayerList.length)];
    //var replaceOpponentName = opponentMatch.html().replace("opponentname", randomOpponent);
    //opponentMatch.html().replace(replaceOpponentName);
    var replaceOpponentName = opponentName.html(randomOpponent);
    opponentMatch.show();
   });

  declineButton.click(function() {
    invitePage.hide();
    gameStart.show();
  });

  newMatchButton.click(function() {
    invitePage.hide();
    gameStart.show();
  });

  socket.on('invite', function (challenger, room, myDesignation) {
    designation = myDesignation; //designation 0 for cartographer, 1 for player
    currentRoom = room; //sets the global room to send with each request, quicker than a hash lookup

    gameStart.hide();
 
    invitePage.show();
    var replacename = nameBox.html().replace("name", challenger);
    nameBox.html(replacename);
    
    var role;
    if (designation == 1) role = "player";
    else role = "obstaclr";

    var replacerole = roleBox.html().replace("role", role);
    roleBox.html(replacerole);
    
  });

  //when they click accept on the invite
  acceptButton.click(function(){
    invitePage.hide();
    acceptButton.css("color", "#ff4900");
    window.history.pushState(null, currentRoom, '/' + currentRoom);
    playersInLobby.remove();
    socket.removeAllListeners("addPlayer");
    socket.removeAllListeners("removePlayer");
    socket.emit('playerAccepts', name, nameBox.html(), currentRoom)
    gameplaySetup();
  });


  //when the challenger recieves an acceptance back
  socket.on('accepted', function (vsName, room) {
    waitingPage.hide();
    currentRoom = room;
    socket.removeAllListeners("addPlayer");
    socket.removeAllListeners("removePlayer");
    window.history.pushState(null, currentRoom, '/' + currentRoom);
    playersInLobby.remove();
    gameStart.hide();
    gameplaySetup();
  })

  var gameplaySetup = function(){ 
    gamebox.show(); 
    createCanvas();
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
      obstaclrLosePage.show();
    }
    else if (designation == 1){
      playerWinPage.show();
    }
    quitButton.click(function(){
      window.location = '/'
      //splashMenu.show();
     });
  }
  
  function obstaclrHasWon(){
    if (designation == 0){
      obstaclrWinPage.show();
    }
    else if (designation == 1){
      playerLosePage.show();
    }
    quitButton.click(function(){
      window.location = '/'
      //splashMenu.show();
    });
  }

  socket.on('playerDeath', function() {
    obstaclrHasWon();
  })

  socket.on('opponentQuit', function() {
    quitPage.show();
  })


  function createCanvas() {
    //actual gameplay shit goes here
    var ctx = $('#canvas')[0].getContext('2d');
    var playerImage = new Image();
    playerImage.src = "shittyplayer.png";

    //player
    function drawPlayer(x,y){
      /*
      ctx.fillStyle = "#ff4900";
      ctx.beginPath();
      ctx.arc(x,y,10,0,Math.PI*2, true);
      ctx.closePath();
      ctx.fill();
      */
      ctx.drawImage(playerImage, x, y, 31, 40);
    }
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

    drawPlayer(10,200);
    if(designation > 0){
      var playerX = 10;
      var playerY = 200;
      var playerDY = 10;
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
        if(upPressed && !downPressed && playerY > 11) playerY = player.y - playerDY;
        if(downPressed && !upPressed && playerY < 389) playerY = player.y +  playerDY;
        if(playerY != player.y){
          socket.emit("playerPosition", player.x, playerY, currentRoom);
        }
        clear(ctx);
        drawPlayer(player.x, playerY);
        var length = lines.length;
        var coloriness = {'0': "#ffbf00", '1': "#0b61a4", '-1': "#444"};
        var currentline = null;
        while (length --){
          currentline = lines[length];
          if(currentline.baseLine.point1.x < 0 && currentline.baseLine.point2.x < 0) break;
          drawLine(ctx, coloriness[currentline.baseLine.color], currentline.baseLine.point1.x, currentline.baseLine.point1.y, currentline.baseLine.point2.x, currentline.baseLine.point2.y);
        }
      });
      
    }
    else if(designation < 1){
      var drawzone = $("#drawzone");
      var drawctx = drawzone[0].getContext('2d');
      var lineStatus = { x1: 0, y2: 0, isStarted: false, color: "#444"};
      var paints = {"#444": 100, "#0b61a4": 100, "#ffbf00": 100};
      var bluecounter = $('#bluecounter');
      var yellowcounter = $('#yellowcounter');
      setInterval(function(){
        if(paints["#0b61a4"] < 100){ paints["#0b61a4"] ++; bluecounter.html(paints["#0b61a4"]);};
        if(paints["#ffbf00"] < 100){ paints["#ffbf00"] ++; yellowcounter.html(paints["#ffbf00"]);};
      }, 100);
      var blackcounter = $("#blackcounter");
      setInterval(function(){
        if(paints["#444"] < 100){ paints["#444"] ++; blackcounter.html(paints["#444"])};
      }, 200);
      var ymax = 200;
      function selectColor(color){
        if(color < 0){
          //black as fuck
          lineStatus.color = '#444';
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
      var lastlineposition = 0;
      drawzone.on("click", function(e){
        if(lastlineposition > 800) return;
        if(lineStatus.isStarted){
          var y = (Math.abs(e.offsetY - lineStatus.y1) < ymax) ? e.offsetY : lineStatus.y1 + ((e.offsetY - lineStatus.y1)/Math.abs(e.offsetY - lineStatus.y1))*ymax;
          var color = -1;
          if(lineStatus.color == "#0b61a4") color = 1;
          if(lineStatus.color == "#ffbf00") color = 0;
          var length = Math.sqrt(Math.pow((e.offsetX - lineStatus.x1),2) + Math.pow((y - lineStatus.y1),2));
          if(paints[lineStatus.color] > Math.floor(length/3)){
            clear(drawctx);
            socket.emit('createLine', lineStatus.x1 + 795, e.offsetX + 795, lineStatus.y1, y,color, currentRoom);
            paints[lineStatus.color] -= Math.floor(length/3);
            lineStatus.isStarted = false;
          }
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
      socket.on('updateCanvas', function drawer(lines, player){
        if(player.x > 590){
          playerHasWon();
          return;
        }
        if(player.x < 10){
          obstaclrHasWon();
          return;
        }
        clear(ctx);
        drawPlayer(player.x, player.y);
        var length = lines.length;
        var coloriness = {'0': "#ffbf00", '1': "#0b61a4", '-1': "#444"};
        var currentline = null;
        if(length) lastlineposition = lines[length-1].baseLine.point1.x > lines[length-1].baseLine.point2.x ? lines[length-1].baseLine.point2.x : lines[length-1].baseLine.point1.x;
        while (length --){
          currentline = lines[length];
          if(currentline.baseLine.point1.x < 0 && currentline.baseLine.point2.x < 0) break;
          drawLine(ctx, coloriness[currentline.baseLine.color], currentline.baseLine.point1.x, currentline.baseLine.point1.y, currentline.baseLine.point2.x, currentline.baseLine.point2.y);
        }
      });
    }
  }    
});
