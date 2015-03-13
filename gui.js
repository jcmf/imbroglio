// Generated by IcedCoffeeScript 1.8.0-d
(function() {
  var $, compile;

  $ = require('jquery');

  compile = require('./compiler').compile;

  $(function() {
    var content, textarea;
    content = $('#content');
    textarea = $('#textarea');
    return textarea.on('input', function(e) {
      var f, rendered, src;
      src = textarea.val();
      f = new Function(compile(src));
      rendered = f();
      content.text(rendered);
    });
  });

}).call(this);