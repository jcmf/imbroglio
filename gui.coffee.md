Okay, how will this work?  This is gonna be a script... we're going
to, uh, hmm.  I guess we can start by having a text area and
re-rendering the text in it as it changes, using the compiler module?
Meh, sure, I guess we can do that somehow probably.

    $ = require 'jquery'
    {parse, compile, prepare, stdlib} = require './compiler'
    $ ->
      $code = $ '#code'
      $content = $ '#content'
      $textarea = $ '#textarea'
      $thisVar = $ '#thisVar'
      recompute = ->
        src = $textarea.val()
        opts =
          argNames: ['arg']
          thisVar: 'imbroglio.state'
          vars: imbroglio: stdlib state: {}
        $('#ast').text parse(src, opts).ast
        $code.text compile src, opts
        opts.handleError = (e) -> console.log e
        prepared = prepare src, opts
        rendered = prepared 'GUI-ARG'
        $content.empty()
        $content.append rendered
        return
      $textarea.on 'input', recompute
      $thisVar.on 'input', recompute

And now just include this script from an HTML page with gribbl.
Yes, that sounds plausible.
