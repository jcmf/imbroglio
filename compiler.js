// Generated by IcedCoffeeScript 1.8.0-d
(function() {
  var quote;

  quote = function(s) {
    return "'" + (s.replace(/([\\'])/g, '\\$1')) + "'";
  };

  exports.compile = function(src, options) {
    if (options == null) {
      options = {};
    }
    return "return document.createTextNode(" + (quote(src)) + ");";
  };

}).call(this);
