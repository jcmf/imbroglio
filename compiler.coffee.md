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
a string?

    exports.compile = (src, options = {}) ->
      escape_char = (ch) ->
        hex = ch.charCodeAt(0).toString 16
        if hex.length > 4 then hex = 'fffd'
        while hex.length < 4
          hex = "0#{hex}"
        "\\u#{hex}"
      quote = (s) -> "\"#{(escape_char ch for ch in src).join ''}\""
      "return #{quote src};";

Okay, good.  Next layer up would be... hmm... something that produces
a top-level script that could go in a web page, perhaps, and displays
the text given to the above thing somewhere on it.  I mean I think
I'll need more layers later, but right now that is a layer I need,
so I can see what I'm doing.

    exports.topLevelScript = (src, options = {}) ->
      fbody = exports.compile src, options
      """
      (function()
      {
        var $ = require('jquery');
        $(function()
        {
          f = function() { #{fbody} };
          $('#content').text(f());
        });
      })();
      """

Will that work?  I think that's okay for now.  I feel like maybe
we could do something clever here with a browserify transform or
something to make the inner function look like a require somehow
maybe, or maybe get the boilerplate to look like that, and then
write the boilerplate in CoffeeScript... anyway this is clearly
fine.

And then we'll need a way of getting that into a script tag on a
web page.  I feel like gribbl ought to be able to help with that.

Okay, okay, hold on, problems.  I'm pretty sure browserify wants
to be able to do its own file I/O.  So I won't be able to run it
in the browser, later.  Will I?  Maybe I can, if I use browserify
to browserify browserify into something with a shimmed fs module
that talks to some kind of virtual filesystem?  Except no, this is
silly....

Ultimately we're going to want to do something like this:

    exports.htmlPage = (src, options = {}) ->
      script = exports.topLevelScript src, options
      """
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <script>#{script}</script>
        </head>
        <body><div id="content"></div></body>
      </html>
      """

There!  That wasn't so bad.  Oh except `require('jquery')` obviously
isn't going to work.  Whatever, I'll fix it later, once I get to the
point where I notice it's broken.

Now all we need is a thing to... man, am I going to use gribbl at
all?  Maybe not?  Well, that's okay, I don't have to use it, I
just thought... hmm.  I mean the goal is to have a GUI for this,
even though right now I'm writing a CLI.

Maybe I should start with a GUI instead.  How hard could it be?
And then the GUI... I mean it's going to call the above function,
I guess...  well but okay, surely I can put the GUI in another
module, yes?  Aha, and *that* I can build with gribbl.  And maybe
it can cannibalize its own markup, or something, when emitting the
non-editable form of the game... well, whatever, worry about that
in a minute, I don't have to use this `htmlPage` thing if I don't
want to.
