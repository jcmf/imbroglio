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

Actually let's start with something simpler!  How about a compiler
that just compiles a function body that returns the given text, as
a DOM node or array thereof?  Something that jQuery can deal with?

    exports.compile = (src, options = {}) ->
      escape_char = (ch) ->
        hex = ch.charCodeAt(0).toString 16
        if hex.length > 4 then hex = 'fffd'
        while hex.length < 4
          hex = "0#{hex}"
        "\\u#{hex}"
      quote = (s) -> "\"#{(escape_char ch for ch in src).join ''}\""
      "return document.createTextNode(#{quote src});";
