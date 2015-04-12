// Generated by IcedCoffeeScript 1.8.0-d
(function() {
  var CoffeeScript, Compiler, Element, Scope, assert, compile, nodes, parse, prepare, quote, render,
    __slice = [].slice;

  quote = function(s) {
    s = s.replace(/([\\'])/g, '\\$1').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
    return "'" + s + "'";
  };

  assert = require('assert');

  CoffeeScript = require('coffee-script');

  Scope = require('coffee-script/lib/coffee-script/scope').Scope;

  nodes = require('coffee-script/lib/coffee-script/nodes');

  Element = (function() {
    function Element() {
      var attrs, children, tag;
      tag = arguments[0], attrs = arguments[1], children = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
      this.tag = tag;
      this.attrs = attrs != null ? attrs : {};
      this.children = children;
    }

    return Element;

  })();

  Compiler = (function() {
    function Compiler() {
      this.referencedVars = [];
      this.scope = new Scope(null, null, null, this.referencedVars);
    }

    Compiler.prototype.refTokens = function(tokens) {
      var token, _i, _len;
      assert(!this.tmpUsed);
      for (_i = 0, _len = tokens.length; _i < _len; _i++) {
        token = tokens[_i];
        if (token.variable) {
          this.referencedVars.push(token[1]);
        }
      }
    };

    Compiler.prototype.lit = function(x) {
      return new nodes.Literal(x);
    };

    Compiler.prototype.val = function() {
      var props, x;
      x = arguments[0], props = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      return new nodes.Value(x, props);
    };

    Compiler.prototype.litval = function(x) {
      return this.val(this.lit(x));
    };

    Compiler.prototype.assign = function(k, v) {
      return new nodes.Assign(this.val(k), v);
    };

    Compiler.prototype.field = function(lit, field) {
      return this.val(lit, new nodes.Access(this.lit(field)));
    };

    Compiler.prototype.string = function(s) {
      return this.litval(quote(s));
    };

    Compiler.prototype.call = function() {
      var arg, args, fn, _i, _len;
      fn = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      for (_i = 0, _len = args.length; _i < _len; _i++) {
        arg = args[_i];
        assert(arg.compileToFragments);
      }
      return new nodes.Call(fn, args);
    };

    Compiler.prototype.callname = function() {
      var args, name;
      name = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      return this.call.apply(this, [this.litval(name)].concat(__slice.call(args)));
    };

    Compiler.prototype.block = function(children) {
      return new nodes.Block(children);
    };

    Compiler.prototype.tmp = function(name) {
      this.tmpUsed = true;
      return this.lit(this.scope.freeVariable(name));
    };

    Compiler.prototype.text = function(s) {
      return this.callname('document.createTextNode', this.string(s));
    };

    Compiler.prototype.elem = function() {
      var attrs, child, children, code, k, tag, tmp, v, _i, _len;
      tag = arguments[0], attrs = arguments[1], children = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
      if (attrs == null) {
        attrs = {};
      }
      tmp = this.tmp(tag);
      code = [this.assign(tmp, this.callname('document.createElement', this.string(tag)))];
      for (k in attrs) {
        v = attrs[k];
        code.push(this.call(this.field(tmp, 'setAttribute'), this.string(k), this.string(v)));
      }
      for (_i = 0, _len = children.length; _i < _len; _i++) {
        child = children[_i];
        code.push(this.call(this.field(tmp, 'appendChild'), this.expand(child)));
      }
      code.push(this.val(tmp));
      return this.val(this.block(code));
    };

    Compiler.prototype.expand = function(child) {
      if (!(child instanceof Element)) {
        return child;
      }
      return this.elem.apply(this, [child.tag, child.attrs].concat(__slice.call(child.children)));
    };

    Compiler.prototype.main = function(result) {
      this.scope.expressions = this.block([new nodes.Return(result)]);
      return {
        scope: this.scope,
        ast: this.scope.expressions,
        level: 1,
        indent: ''
      };
    };

    return Compiler;

  })();

  exports.parse = parse = function(src, opts) {
    var XXX, YYY, ast, code, codeBegin, codeEnd, compiler, e, end, error, found, idx, p, pieces, pp, start, tokens;
    if (opts == null) {
      opts = {};
    }
    compiler = new Compiler();
    codeBegin = '#{';
    codeEnd = '}';
    pp = (function() {
      var _i, _j, _k, _len, _ref, _results;
      _ref = src.split(/\n\s*\n/);
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        p = _ref[_i];
        if (!/\S/.test(p)) {
          continue;
        }
        pieces = [];
        idx = 0;
        for (XXX = _j = 0; _j <= 99; XXX = ++_j) {
          found = p.indexOf(codeBegin, idx);
          if (found < 0) {
            found = p.length;
          }
          pieces.push(compiler.text(p.substring(idx, found)));
          if (found === p.length) {
            break;
          }
          start = found + codeBegin.length;
          end = start - 1;
          error = true;
          for (YYY = _k = 0; _k <= 99; YYY = ++_k) {
            end = p.indexOf(codeEnd, end + 1);
            if (end < 0) {
              idx = p.length;
              break;
            }
            code = p.substring(start, end);
            try {
              tokens = CoffeeScript.tokens(code);
              ast = CoffeeScript.nodes(tokens);
            } catch (_error) {
              e = _error;
              error = e;
              continue;
            }
            error = null;
            compiler.refTokens(tokens);
            pieces.push(ast);
            idx = end + codeEnd.length;
            break;
          }
          if (error) {
            if (opts.handleError) {
              opts.handleError({
                error: error
              });
            }
            pieces.push(new Element('span', {
              "class": 'error',
              title: error.toString()
            }, compiler.text(codeBegin)));
            idx = start;
          }
        }
        _results.push((function(func, args, ctor) {
          ctor.prototype = func.prototype;
          var child = new ctor, result = func.apply(child, args);
          return Object(result) === result ? result : child;
        })(Element, ['p', {}].concat(__slice.call(pieces)), function(){}));
      }
      return _results;
    })();
    return compiler.main(compiler.elem.apply(compiler, ['div', {
      "class": 'passage'
    }].concat(__slice.call(pp))));
  };

  exports.compile = compile = function(src, opts) {
    var fragment, fragments, o;
    o = parse(src, opts);
    fragments = o.ast.compileWithDeclarations(o);
    return ((function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = fragments.length; _i < _len; _i++) {
        fragment = fragments[_i];
        _results.push(fragment.code);
      }
      return _results;
    })()).join('');
  };

  exports.prepare = prepare = function(src, opts) {
    return new Function(compile(src, opts));
  };

  exports.render = render = function(src, opts) {
    return prepare(src, opts)();
  };

}).call(this);
