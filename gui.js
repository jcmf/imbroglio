// Generated by IcedCoffeeScript 1.8.0-d
(function() {
  var $, compile, parse, prepare, stdlib, _ref;

  $ = require('jquery');

  _ref = require('./compiler'), parse = _ref.parse, compile = _ref.compile, prepare = _ref.prepare, stdlib = _ref.stdlib;

  $(function() {
    var $code, $content, $textarea, $thisVar, recompute;
    $code = $('#code');
    $content = $('#content');
    $textarea = $('#textarea');
    $thisVar = $('#thisVar');
    recompute = function() {
      var opts, prepared, rendered, src;
      src = $textarea.val();
      opts = {
        argNames: ['arg'],
        thisVar: 'imbroglio.state',
        vars: {
          imbroglio: stdlib({
            state: {}
          })
        }
      };
      $('#ast').text(parse(src, opts).ast);
      $code.text(compile(src, opts));
      opts.handleError = function(e) {
        return console.log(e);
      };
      prepared = prepare(src, opts);
      rendered = prepared('GUI-ARG');
      $content.empty();
      $content.append(rendered);
    };
    $textarea.on('input', recompute);
    return $thisVar.on('input', recompute);
  });

}).call(this);
