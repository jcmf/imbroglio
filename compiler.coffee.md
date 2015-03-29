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

    exports.compile = compile = (src, opts = {}) ->
      pp = for p in src.split /\n\s*\n/
        if not /\S/.test p then continue
        "_tag('p', {}, _text(#{quote p}))"
      "return [#{pp.join ', '}];"

    exports._tag = _tag = (name, attrs = {}, children...) ->
      result = document.createElement name
      for k, v of attrs
        result.setAttribute k, v
      for child in children
        result.appendChild child
      return result

    exports._text = _text = (text) -> document.createTextNode text

    exports.prepare = prepare = (src, opts) ->
      new Function('_tag', '_text', compile src, opts).bind null, _tag, _text

    exports.render = render = (src, opts) ->
      prepare(src, opts)()

