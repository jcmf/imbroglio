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

    quote = (s) ->
      s = s
      .replace /([\\'])/g, '\\$1'
      .replace /\n/g, '\\n'
      .replace /\r/g, '\\r'
      return "'#{s}'"

    assert = require 'assert'
    {CoffeeScript} = require 'coffee-script'
    {Scope} = require 'coffee-script/lib/coffee-script/scope'
    nodes = require 'coffee-script/lib/coffee-script/nodes'

    class Element
      constructor: (@tag, @attrs = {}, @children...) ->

    class Compiler
      constructor: ->
        @referencedVars = []
        @scope = new Scope null, null, null, @referencedVars
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
      tmp: (name) ->
        @tmpUsed = yes
        @lit @scope.freeVariable name
      text: (s) -> @callname 'document.createTextNode', @string s
      elem: (tag, attrs = {}, children...) ->
        tmp = @tmp tag
        code = [@assign tmp, @callname 'document.createElement', @string tag]
        for k, v of attrs
          code.push @call @field(tmp, 'setAttribute'), @string(k), @string(v)
        for child in children
          code.push @call @field(tmp, 'appendChild'), @expand child
        code.push @val tmp
        return @val @block code
      expand: (child) ->
        if child not instanceof Element then return child
        @elem child.tag, child.attrs, child.children...
      main: (result) ->
        @scope.expressions = @block [new nodes.Return result]
        return scope: @scope, ast: @scope.expressions, level: 1, indent: ''

    exports.parse = parse = (src, opts = {}) ->
      compiler = new Compiler()
      codeBegin = '#{'
      codeEnd = '}'
      pp = for p in src.split /\n\s*\n/
        if not /\S/.test p then continue
        pieces = []
        idx = 0
        for XXX in [0..99] # loop
          found = p.indexOf codeBegin, idx
          if found < 0 then found = p.length
          pieces.push compiler.text p.substring idx, found
          if found == p.length then break
          start = found + codeBegin.length
          end = start - 1
          error = true
          for YYY in [0..99] # loop
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
            pieces.push new Element 'span', {class: 'error'}, compiler.text codeBegin
            idx = start
        new Element 'p', {}, pieces...
      return compiler.main compiler.elem 'div', {class: 'passage'}, pp...

    exports.compile = compile = (src, opts) ->
      o = parse src, opts
      # To get a source map, I'll need to use ast.compileToFragments().
      # look at what CoffeeScript.compile() is doing....
      fragments = o.ast.compileWithDeclarations o
      (fragment.code for fragment in fragments).join ''

    exports.prepare = prepare = (src, opts) -> new Function compile src, opts

    exports.render = render = (src, opts) -> prepare(src, opts)()

