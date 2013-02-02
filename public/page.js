$(function() {

  var splashmenu =  $(".splash-menu");
  var nextbutton = $("#nextbutton");
  var gamestart = $("#game-start");


  $(document).ready(function() {
  });

  $("#nextbutton").click(function() {
    splashmenu.remove();
    gamestart.fadeIn('fast', function() {
      });
  });

});