// Generated by IcedCoffeeScript 1.8.0-d
(function() {
  var fs, imbroglio, src;

  fs = require('fs');

  src = fs.readFileSync("" + __dirname + "/game.txt", 'utf8');

  imbroglio = require('.');

  imbroglio.play.start(src);

}).call(this);
