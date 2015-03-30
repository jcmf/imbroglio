// Generated by IcedCoffeeScript 1.8.0-d
(function() {
  var $, compile, parse, render, _ref;

  $ = require('jquery');

  _ref = require('./compiler'), parse = _ref.parse, compile = _ref.compile, render = _ref.render;

  $(function() {
    var $code, $content, $textarea;
    $code = $('#code');
    $content = $('#content');
    $textarea = $('#textarea');
    return $textarea.on('input', function(e) {
      var rendered, src;
      src = $textarea.val();
      $('#ast').text(parse(src).ast);
      $code.text(compile(src));
      rendered = render(src);
      $content.empty();
      $content.append(rendered);
    });
  });

}).call(this);
