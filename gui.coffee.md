Okay, how will this work?  This is gonna be a script... we're going
to, uh, hmm.  I guess we can start by having a text area and
re-rendering the text in it as it changes, using the compiler module?
Meh, sure, I guess we can do that somehow probably.

    $ = require 'jquery'
    {compile} = require './compiler'
    $ ->
      content = $ '#content'
      textarea = $ '#textarea'
      textarea.on 'input', (e) ->
        src = textarea.val()
        f = new Function compile src
        rendered = f()
        content.text rendered
        return

And now just include this script from an HTML page with gribbl.
Yes, that sounds plausible.