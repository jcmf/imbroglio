// Generated by IcedCoffeeScript 1.8.0-d
(function() {
  var CoffeeScript, Compiler, Scope, assert, compile, nodes, parse, prepare, quote, render,
    __slice = [].slice;

  exports.quote = quote = function(s) {
    s = s.replace(/([\\'])/g, '\\$1').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
    return "'" + s + "'";
  };

  exports.stdlib = function(imbroglio) {
    if (imbroglio == null) {
      imbroglio = {};
    }
    imbroglio.elem || (imbroglio.elem = function() {
      var addChild, attrs, child, children, k, result, tag, v, _i, _len;
      tag = arguments[0], attrs = arguments[1], children = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
      if (attrs == null) {
        attrs = {};
      }
      result = window.document.createElement(tag);
      for (k in attrs) {
        v = attrs[k];
        result.setAttribute(k, v);
      }
      addChild = function(child) {
        var c, _i, _len;
        if ((child == null) || child === '') {
          return;
        }
        if (child instanceof Array) {
          for (_i = 0, _len = child.length; _i < _len; _i++) {
            c = child[_i];
            addChild(c);
          }
          return;
        }
        if (!child.cloneNode) {
          child = "" + child;
          if (this.smartQuotes) {
            child = child.replace(/(\s)"/g, '$1\u201c').replace(/^"(\w)/g, '\u201c$2').replace('"', '\u201d').replace(/(\s)'/g, '$1\u2018').replace(/^'(\w)/g, '\u2018$1').replace("'", '\u2019');
          }
          if (this.smartPunct) {
            child = child.replace(/\s+--\s+/g, '\u2009\u2014\u2009').replace(/--\s+/g, '\u2014\u2009').replace(/\s+--/g, '\u2009\u2014').replace(/--/g, '\u2014').replace(/\.{3}/g, '\u2026');
          }
          child = window.document.createTextNode(child);
        }
        result.appendChild(child);
      };
      for (_i = 0, _len = children.length; _i < _len; _i++) {
        child = children[_i];
        addChild(child);
      }
      return result;
    });
    return imbroglio;
  };

  assert = require('assert');

  CoffeeScript = require('coffee-script');

  Scope = require('coffee-script/lib/coffee-script/scope').Scope;

  nodes = require('coffee-script/lib/coffee-script/nodes');

  Compiler = (function() {
    function Compiler(opts) {
      this.opts = opts;
      this.referencedVars = [];
      this.scope = new Scope(null, null, null, this.referencedVars);
    }

    Compiler.prototype.refTokens = function(tokens) {
      var token, _i, _len;
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

    Compiler.prototype.ret = function(result) {
      return new nodes.Return(result);
    };

    Compiler.prototype.blockret = function(result) {
      return this.block([this.ret(result)]);
    };

    Compiler.prototype.wrap = function(ast) {
      if (!this.opts.thisVar) {
        return ast;
      }
      return this.blockret(this.call(this.field(new nodes.Parens(this.block([new nodes.Code([], ast)])), 'call'), this.litval(this.opts.thisVar)));
    };

    Compiler.prototype.text = function(s) {
      return this.string(s);
    };

    Compiler.prototype.obj = function(obj) {
      var attrs, k, v;
      attrs = (function() {
        var _results;
        _results = [];
        for (k in obj) {
          v = obj[k];
          assert('string' === typeof v, v);
          _results.push(new nodes.Assign(this.string(k), this.string(v), 'object'));
        }
        return _results;
      }).call(this);
      return this.val(new nodes.Obj(attrs));
    };

    Compiler.prototype.elem = function() {
      var attrs, children, tag;
      tag = arguments[0], attrs = arguments[1], children = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
      if (attrs == null) {
        attrs = {};
      }
      return this.callname.apply(this, ['imbroglio.elem', this.string(tag), this.obj(attrs)].concat(__slice.call(children)));
    };

    Compiler.prototype.main = function(result) {
      this.scope.expressions = this.wrap(this.blockret(result));
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
    var ast, code, codeBegin, codeEnd, compiler, e, end, error, found, idx, p, pieces, pp, start, tokens;
    if (opts == null) {
      opts = {};
    }
    compiler = new Compiler(opts);
    codeBegin = '#{';
    codeEnd = '}';
    pp = (function() {
      var _i, _len, _ref, _results;
      _ref = src.split(/\n\s*\n/);
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        p = _ref[_i];
        if (!/\S/.test(p)) {
          continue;
        }
        pieces = [];
        idx = 0;
        while (true) {
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
          while (true) {
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
            pieces.push(compiler.elem('span', {
              "class": 'error',
              title: error.toString()
            }, compiler.text(codeBegin)));
            idx = start;
          }
        }
        _results.push(compiler.elem.apply(compiler, ['p', {}].concat(__slice.call(pieces))));
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
    var argNames, code, f, k, varNames;
    code = compile(src, opts);
    varNames = !opts.vars ? [] : (function() {
      var _results;
      _results = [];
      for (k in opts.vars) {
        _results.push(k);
      }
      return _results;
    })();
    argNames = varNames.concat(opts.argNames || []);
    f = (function(func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor, result = func.apply(child, args);
      return Object(result) === result ? result : child;
    })(Function, __slice.call(argNames).concat([code]), function(){});
    if (varNames.length) {
      f = f.bind.apply(f, [null].concat(__slice.call((function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = varNames.length; _i < _len; _i++) {
          k = varNames[_i];
          _results.push(opts.vars[k]);
        }
        return _results;
      })())));
    }
    return f;
  };

  exports.render = render = function(src, opts) {
    return prepare(src, opts)();
  };

}).call(this);
