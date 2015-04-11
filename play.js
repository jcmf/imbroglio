// Generated by IcedCoffeeScript 1.8.0-d
(function() {
  var $, assert, choiceChars, compile, error, hashchange, mkElem, mkText, newGame, restore, turn;

  choiceChars = '0123456789abcdefghijklmnopqrstuvwxyz';

  error = function(msg) {
    throw new Error(msg);
  };

  assert = require('assert');

  $ = require('jquery');

  mkText = function(s) {
    return window.document.createTextNode(s);
  };

  mkElem = function(tag, children, attrs) {
    var child, k, result, v, _i, _len;
    if (children == null) {
      children = [];
    }
    if (attrs == null) {
      attrs = {};
    }
    result = window.document.createElement(tag);
    for (k in attrs) {
      v = attrs[k];
      result.setAttribute(k, v);
    }
    for (_i = 0, _len = children.length; _i < _len; _i++) {
      child = children[_i];
      if (child) {
        result.appendChild(child);
      }
    }
    return result;
  };

  exports.compile = compile = function(src) {
    var firstPassage, passages, render;
    passages = {};
    firstPassage = null;
    (function() {
      var lastPassage, m, re;
      re = /(?:^\s*\n?|\n\n)#\s*([^\n]*\S)\s*\n/g;
      lastPassage = null;
      while (m = re.exec(src)) {
        if (lastPassage) {
          lastPassage.endIndex = m.index;
        }
        lastPassage = {
          name: m[1],
          startIndex: re.lastIndex
        };
        assert(!(lastPassage.name in passages), lastPassage.name);
        passages[lastPassage.name] = lastPassage;
        firstPassage || (firstPassage = lastPassage);
      }
      if (!lastPassage) {
        error('no passages found');
      }
      lastPassage.endIndex = src.length;
    })();
    (function() {
      var k, v, _fn;
      _fn = function() {
        var index, linkCount, m, p, pp, re;
        v.src = src.substring(v.startIndex, v.endIndex);
        re = /\[\[([^\]]*)\]\]|(\n\n)/g;
        index = 0;
        v.pp = pp = [p = []];
        linkCount = 0;
        while (m = re.exec(v.src)) {
          (function() {
            var link, lm, offset;
            if (m.index !== index) {
              p.push({
                text: v.src.substring(index, m.index),
                startIndex: v.startIndex + index,
                endIndex: v.startIndex + m.index
              });
            }
            index = re.lastIndex;
            if (m[2]) {
              pp.push(p = []);
              return;
            }
            link = m[1];
            offset = v.startIndex + m.index;
            if (!(lm = /(.*)->([^\s<>]+)/.exec(link))) {
              error("malformed link [[" + link + "]], passage " + k + ", offset " + offset);
            }
            if (linkCount >= choiceChars.length) {
              error("too many links, passage " + k + ", offset " + offset);
            }
            if (!(lm[2] in passages)) {
              error("bad link target " + lm[2] + ", passage " + k + ", offset " + offset);
            }
            p.push({
              text: lm[1],
              target: lm[2],
              choiceChar: choiceChars[linkCount++],
              startIndex: v.startIndex + m.index,
              endIndex: v.startIndex + index
            });
          })();
        }
        if (index !== v.src.length) {
          p.push({
            text: v.src.substring(index),
            startIndex: v.startIndex + index,
            endIndex: v.startIndex + v.src.length
          });
        }
        if (!p.length) {
          pp.pop();
        }
        if (!pp.length) {
          return error("empty passage " + k + ", offset " + v.startIndex);
        }
      };
      for (k in passages) {
        v = passages[k];
        _fn();
      }
    })();
    render = function(passage, attrs) {
      var children, links, moves;
      if (attrs == null) {
        attrs = {};
      }
      moves = attrs.moves || (attrs.moves = '');
      links = {};
      children = (function() {
        var gchild, grandchildren, item, p, _i, _len, _ref, _results;
        _ref = passage.pp;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          p = _ref[_i];
          grandchildren = (function() {
            var _j, _len1, _results1;
            _results1 = [];
            for (_j = 0, _len1 = p.length; _j < _len1; _j++) {
              item = p[_j];
              gchild = mkText(item.text);
              if (item.target) {
                gchild = mkElem('a', [gchild], {
                  href: "#!" + moves + item.choiceChar,
                  "class": 'choice'
                });
                assert(item.choiceChar);
                assert(!links[item.choiceChar]);
                links[item.choiceChar] = {
                  el: gchild,
                  target: item.target
                };
              }
              _results1.push(gchild);
            }
            return _results1;
          })();
          _results.push(mkElem('p', grandchildren));
        }
        return _results;
      })();
      attrs.passageElem = mkElem('div', children, {
        "class": 'passage'
      });
      attrs.choose = function(ch) {
        var link;
        if (!(link = links[ch])) {
          console.log("invalid move " + ch + " from passage " + passage.name);
          return null;
        }
        return render(passages[link.target], {
          moves: "" + moves + ch,
          chosenElem: link.el
        });
      };
      return attrs;
    };
    return function() {
      return render(firstPassage);
    };
  };

  newGame = turn = null;

  restore = function(moves) {
    var $output, $p, ch, last, prevTurn, _i, _len, _ref;
    if ((turn != null ? turn.moves : void 0) === moves) {
      return;
    }
    $('#loading').show();
    $('.pane').hide();
    $('#game').hide();
    $output = $('#output');
    if (!turn) {
      turn = newGame();
      $output.empty();
      $output.append(turn.passageElem);
    } else {
      last = function() {
        var children;
        children = $output.children();
        if (children.length) {
          return $(children.get(children.length - 1));
        } else {
          return children;
        }
      };
      while (turn.moves !== moves.slice(0, turn.moves.length)) {
        last().remove();
        turn = turn.prevTurn;
      }
      last().find('.chosen').removeClass('chosen');
    }
    _ref = moves.slice(turn.moves.length);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      ch = _ref[_i];
      prevTurn = turn;
      if (!(turn = turn.choose(ch))) {
        $('#404-pane').show();
        $('#loading').hide();
        return;
      }
      turn.prevTurn = prevTurn;
      $(turn.chosenElem).addClass('chosen');
      $output.append(turn.passageElem);
    }
    $('#game').show();
    $('#loading').hide();
    $p = $(turn.passageElem);
    window.scrollTo(0, $p.offset().top - $p.css('margin-top'));
  };

  hashchange = function() {
    var hash, m, target;
    hash = window.location.hash.replace(/^#/, '');
    if (m = /^!(.*)$/.exec(hash)) {
      return restore(m[1]);
    }
    turn = target = null;
    if (m = /^\/([a-z][a-z-]*)$/.exec(hash)) {
      target = $("#" + m[1] + "-pane");
    }
    if (!(target != null ? target.length : void 0)) {
      target = $('#home');
    }
    $('#game').hide();
    $('#output').empty();
    $('.pane').hide();
    target.show();
    $('#loading').hide();
    window.scrollTo(0, 0);
  };

  exports.start = function(src) {
    newGame = compile(src);
    return $(function() {
      (function() {
        var m, _ref;
        m = /([^\/]+)$/.exec(((_ref = window.location) != null ? _ref.pathname : void 0) || '');
        if (m) {
          $('a[href="#"], a[href="#/"]').attr('href', m[1]);
        }
      })();
      $(window).on('hashchange', function(e) {
        e.preventDefault();
        hashchange();
        return true;
      });
      hashchange();
    });
  };

}).call(this);
