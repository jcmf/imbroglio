# imbroglio/compiler

This will be the core thing that takes a source file or string and
turns it into a browser-side Javascript function-expression.  When
run, each such function returns a DOM tree.  Some functions might
act as templates that take arguments.

I'm calling this submodule `compiler`, but it's also the runtime
environment.  Because the runtime environment includes the compiler,
obviously.  Because it also needs to be able to act as an interpreter.
Probably.

So what's the language we're compiling?  Basically it looks like
plain text.  With a few things borrowed from or inspired by Markdown.
So, for example, `*this*` is emphasized (italicized, or whatever
else the stylesheet wants to do with it).

Unlike Markdown, `#{this}` is interpolated CoffeeScript code, with
the result evaluated at the time the text is displayed and inserted
at that point in the document.  A paragraph starting with `%do`
runs CoffeeScript when the text is displayed and ignores any result.
`%say` is like `%do` but treats the result as one or more paragraphs
or other block-level elements to insert.

I'll add more later, but let me see if I can even get that much
working.

    exports.quote = quote = (s) ->
      s = s
      .replace /([\\'])/g, '\\$1'
      .replace /\n/g, '\\n'
      .replace /\r/g, '\\r'
      return "'#{s}'"

    exports.stdlib = (imbroglio = {}) ->
      imbroglio.elem or= (tag, attrs = {}, children...) ->
        result = window.document.createElement tag
        result.setAttribute k, v for k, v of attrs
        addChild = (child) ->
          if not child? or child is '' then return
          if child instanceof Array
            addChild c for c in child
            return
          if not child.cloneNode
            child = window.document.createTextNode "#{child}"
          result.appendChild child
          return
        addChild child for child in children
        result
      imbroglio

    assert = require 'assert'
    CoffeeScript = require 'coffee-script'
    {Scope} = require 'coffee-script/lib/coffee-script/scope'
    nodes = require 'coffee-script/lib/coffee-script/nodes'

    class Element # XXX remove
      constructor: (@tag, @attrs = {}, @children...) ->

    class Compiler
      constructor: (@opts) ->
        @referencedVars = []
        @scope = new Scope null, null, null, @referencedVars  # XXX remove
      refTokens: (tokens) ->
        assert not @tmpUsed
        for token in tokens
          if token.variable
            @referencedVars.push token[1]
        return
      lit: (x) -> new nodes.Literal x
      val: (x, props...) -> new nodes.Value x, props
      litval: (x) -> @val @lit x
      assign: (k, v) -> new nodes.Assign @val(k), v
      field: (lit, field) -> @val lit, new nodes.Access @lit field
      string: (s) -> @litval quote s
      call: (fn, args...) ->
        for arg in args
          assert arg.compileToFragments
        new nodes.Call fn, args
      callname: (name, args...) -> @call @litval(name), args...
      block: (children) -> new nodes.Block children
      ret: (result) -> new nodes.Return result
      blockret: (result) -> @block [@ret result]
      wrap: (ast) ->
        if not @opts.thisVar then return ast
        @blockret @call(@field(new nodes.Parens(@block [new nodes.Code([], ast)]), 'call'), @litval @opts.thisVar)
      tmp: (name) -> # XXX remove
        @tmpUsed = yes
        @lit @scope.freeVariable name
      text: (s) -> @string s
      obj: (obj) ->
        attrs = for k, v of obj
          assert 'string' is typeof v, v
          new nodes.Assign @string(k), @string(v), 'object'
        @val new nodes.Obj attrs
      elem: (tag, attrs = {}, children...) ->
        @callname 'imbroglio.elem', @string(tag), @obj(attrs), children...
      expand: (child) -> # XXX remove
        if child not instanceof Element then return child
        @elem child.tag, child.attrs, child.children...
      main: (result) ->
        @scope.expressions = @wrap @blockret result
        return scope: @scope, ast: @scope.expressions, level: 1, indent: ''

    exports.parse = parse = (src, opts = {}) ->
      compiler = new Compiler opts
      codeBegin = '#{'
      codeEnd = '}'
      pp = for p in src.split /\n\s*\n/
        if not /\S/.test p then continue
        pieces = []
        idx = 0
        loop
          found = p.indexOf codeBegin, idx
          if found < 0 then found = p.length
          pieces.push compiler.text p.substring idx, found
          if found == p.length then break
          start = found + codeBegin.length
          end = start - 1
          error = true
          loop
            end = p.indexOf codeEnd, end + 1
            if end < 0
              idx = p.length
              break
            code = p.substring start, end
            try
              tokens = CoffeeScript.tokens code
              ast = CoffeeScript.nodes tokens
            catch e
              error = e
              continue
            error = null
            compiler.refTokens tokens
            pieces.push ast
            idx = end + codeEnd.length
            break
          if error
            if opts.handleError then opts.handleError {error}
            pieces.push compiler.elem 'span', {class: 'error', title: error.toString()}, compiler.text codeBegin
            idx = start
        compiler.elem 'p', {}, pieces...
      return compiler.main compiler.elem 'div', {class: 'passage'}, pp...

    exports.compile = compile = (src, opts) ->
      o = parse src, opts
      # To get a source map, I'll need to use ast.compileToFragments().
      # Look at what CoffeeScript.compile() is doing....
      fragments = o.ast.compileWithDeclarations o
      (fragment.code for fragment in fragments).join ''

    exports.prepare = prepare = (src, opts) ->
      code = compile src, opts
      varNames = if not opts.vars then [] else (k for k of opts.vars)
      argNames = varNames.concat opts.argNames or []
      f = new Function argNames..., code
      if varNames.length
        f = f.bind null, (opts.vars[k] for k in varNames)...
      return f

    exports.render = render = (src, opts) -> prepare(src, opts)()

