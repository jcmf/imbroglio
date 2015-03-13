// Generated by IcedCoffeeScript 1.8.0-d
(function() {
  exports.compile = function(src, options) {
    var escape_char, quote;
    if (options == null) {
      options = {};
    }
    escape_char = function(ch) {
      var hex;
      hex = ch.charCodeAt(0).toString(16);
      if (hex.length > 4) {
        hex = 'fffd';
      }
      while (hex.length < 4) {
        hex = "0" + hex;
      }
      return "\\u" + hex;
    };
    quote = function(s) {
      var ch;
      return "\"" + (((function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = src.length; _i < _len; _i++) {
          ch = src[_i];
          _results.push(escape_char(ch));
        }
        return _results;
      })()).join('')) + "\"";
    };
    return "return " + (quote(src)) + ";";
  };

  exports.topLevelScript = function(src, options) {
    var fbody;
    if (options == null) {
      options = {};
    }
    fbody = exports.compile(src, options);
    return "(function()\n{\n  var $ = require('jquery');\n  $(function()\n  {\n    f = function() { " + fbody + " };\n    $('#content').text(f());\n  });\n})();";
  };

  exports.htmlPage = function(src, options) {
    var script;
    if (options == null) {
      options = {};
    }
    script = exports.topLevelScript(src, options);
    return "<!DOCTYPE html>\n<html lang=\"en\">\n  <head>\n    <script>" + script + "</script>\n  </head>\n  <body><div id=\"content\"></div></body>\n</html>";
  };

}).call(this);
