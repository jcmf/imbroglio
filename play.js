// Generated by IcedCoffeeScript 1.8.0-d
(function() {
  var $, assert, choiceChars, compile, elem, hashchange, newGame, normalize, prepare, quote, restore, stdlib, turn, _ref;

  choiceChars = 'abcdefghijklmnopqrstuvwxyz0123456789';

  assert = require('assert');

  $ = require('jquery');

  _ref = require('./compiler'), quote = _ref.quote, stdlib = _ref.stdlib, prepare = _ref.prepare;

  elem = stdlib().elem;

  normalize = function(s) {
    return s.replace(/^\s+/, '').replace(/\s+$/, '').replace(/\s+/, ' ');
  };

  exports.compile = compile = function(src, opts) {
    var firstPassage, handleError, passages, render;
    if (opts == null) {
      opts = {};
    }
    handleError = opts.handleError || function(msg) {
      return console.log(msg);
    };
    passages = {};
    firstPassage = null;
    (function() {
      var lastPassage, m, re;
      re = /(?:^\s*\n?|\n\n)#(?!\{)\s*([^\n]*\S)\s*\n/g;
      lastPassage = null;
      while (m = re.exec(src)) {
        if (lastPassage) {
          lastPassage.endIndex = m.index;
        }
        lastPassage = {
          name: normalize(m[1]),
          startIndex: re.lastIndex
        };
        assert(!(lastPassage.name in passages), lastPassage.name);
        passages[lastPassage.name] = lastPassage;
        firstPassage || (firstPassage = lastPassage);
      }
      if (!lastPassage) {
        handleError('no passages found');
      }
      lastPassage.endIndex = src.length;
    })();
    (function() {
      var k, v, _fn;
      _fn = function() {
        v.src = src.substring(v.startIndex, v.endIndex);
        v.mungedSrc = v.src.replace(/\[\[([^\]]*)\]\]/g, function(outer, inner, index) {
          var m, offset, target, text;
          offset = index + v.startIndex;
          text = target = inner;
          if (m = /^(.*)->\s*([^<>]*[^\s<>])\s*$/.exec(inner)) {
            text = m[1];
            target = m[2];
          } else if (m = /^\s*([^<>]*[^\s<>])\s*<-(.*)$/.exec(inner)) {
            target = m[1];
            text = m[2];
          }
          target = normalize(target);
          if (!(target in passages)) {
            handleError("bad link target '" + target + "' at " + outer + ", passage '" + k + "', offset " + offset);
          }
          return "#\{imbroglio.mkLink " + (quote(target)) + ", " + (quote(text)) + "}";
        });
        v.prepared = prepare(v.mungedSrc, {
          argNames: ['imbroglio'],
          thisVar: 'imbroglio.state',
          handleError: function(e) {
            console.log(e);
            if (e.error instanceof Error) {
              throw e.error;
            } else if (e.error) {
              throw new Error(e.error);
            } else {
              throw new Error(e);
            }
          }
        });
      };
      for (k in passages) {
        v = passages[k];
        _fn();
      }
    })();
    render = function(passage, result) {
      var linkCount, links, mkLink, moves, state;
      if (result == null) {
        result = {};
      }
      state = result.state || {};
      delete result.state;
      moves = result.moves || (result.moves = '');
      links = {};
      linkCount = 0;
      mkLink = function(target, text) {
        var choiceChar, el;
        if (!(target in passages)) {
          return elem('span', {
            "class": 'error'
          }, "ERROR: bad link target '" + target + "' in passage '" + passage.name + "': " + text);
        } else if (linkCount >= choiceChars.length) {
          return elem('span', {
            "class": 'error'
          }, "ERROR: too many links, passage '" + passage.name + "', target '" + target + "': " + text);
        }
        choiceChar = choiceChars[linkCount++];
        el = elem('a', {
          "class": 'choice',
          href: "#!" + moves + choiceChar
        }, text);
        links[choiceChar] = {
          el: el,
          target: target
        };
        return el;
      };
      result.passageElem = passage.prepared(stdlib({
        mkLink: mkLink,
        state: state
      }));
      result.choose = function(ch) {
        var link;
        if (!(link = links[ch])) {
          console.log("invalid move " + ch + " from passage " + passage.name);
          return null;
        }
        $(link.el).addClass('chosen');
        return render(passages[link.target], {
          moves: "" + moves + ch,
          state: state
        });
      };
      return result;
    };
    return function() {
      return render(firstPassage);
    };
  };

  newGame = turn = null;

  restore = function(moves) {
    var $chosen, $output, $p, ch, last, prevTurn, scrollPos, _i, _len, _ref1;
    if ((turn != null ? turn.moves : void 0) === moves) {
      return;
    }
    $('#loading').show();
    $('.pane').hide();
    $('#game').hide();
    $output = $('#output');
    last = function() {
      var children;
      children = $output.children();
      if (children.length) {
        return $(children.get(children.length - 1));
      } else {
        return children;
      }
    };
    if (!turn || turn.moves !== moves.slice(0, turn.moves.length)) {
      turn = newGame();
      $output.empty();
      $output.append(turn.passageElem);
    }
    _ref1 = moves.slice(turn.moves.length);
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      ch = _ref1[_i];
      prevTurn = turn;
      if (!(turn = turn.choose(ch))) {
        $('#404-pane').show();
        $('#loading').hide();
        return;
      }
      turn.prevTurn = prevTurn;
      $output.append(turn.passageElem);
    }
    $output.children().removeClass('current');
    last().addClass('current');
    $('#game').show();
    $('#loading').hide();
    $p = $(turn.passageElem);
    $chosen = $('.chosen');
    scrollPos = !$chosen.length ? 0 : $($chosen.get($chosen.length - 1)).offset().top;
    console.log("XXX scrollPos = " + scrollPos);
    window.scrollTo(0, scrollPos);
  };

  hashchange = function() {
    var hash, m, target;
    hash = window.location.hash.replace(/^#/, '');
    if (m = /^!(.*)$/.exec(hash)) {
      return restore(m[1]);
    }
    turn = target = null;
    if (!hash) {
      target = $('#home');
    } else if (m = /^\/([a-z][a-z0-9-]*)$/.exec(hash)) {
      target = $("#" + m[1] + "-pane");
    }
    if (!(target != null ? target.length : void 0)) {
      target = $('#404-pane');
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
        var m, _ref1;
        m = /([^\/]+)$/.exec(((_ref1 = window.location) != null ? _ref1.pathname : void 0) || '');
        $('a[href="#"], a[href="#/"]').attr('href', m ? m[1] : '.');
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
