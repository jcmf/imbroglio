choiceChars = 'abcdefghijklmnopqrstuvwxyz0123456789'

assert = require 'assert'
$ = require 'jquery'
{quote, stdlib, prepare} = require './compiler'
{elem} = stdlib()

normalize = (s) ->
  s
  .replace /^\s+/, ''
  .replace /\s+$/, ''
  .replace /\s+/, ' '

exports.compile = compile = (src, opts = {}) ->
  handleError = opts.handleError or (msg) -> console.log msg
  passages = {}
  firstPassage = null
  do ->
    re = /(?:^\s*\n?|\n\n)#(?!\{)\s*([^\n]*\S)\s*\n/g
    lastPassage = null
    while m = re.exec src
      if lastPassage then lastPassage.endIndex = m.index
      lastPassage = name: normalize(m[1]), startIndex: re.lastIndex
      assert lastPassage.name not of passages, lastPassage.name
      passages[lastPassage.name] = lastPassage
      firstPassage or= lastPassage
    if not lastPassage then handleError 'no passages found'
    lastPassage.endIndex = src.length
    return
  do ->
    for k, v of passages then do ->
      v.src = src.substring v.startIndex, v.endIndex
      v.mungedSrc = v.src.replace /\[\[([^\]]*)\]\]/g, (outer, inner, index) ->
        offset = index + v.startIndex
        text = target = inner
        if m = /^(.*)->\s*([^<>]*[^\s<>])\s*$/.exec inner
          text = m[1]
          target = m[2]
        else if m = /^\s*([^<>]*[^\s<>])\s*<-(.*)$/.exec inner
          target = m[1]
          text = m[2]
        target = normalize target
        if target not of passages
          handleError "bad link target '#{target}' at #{outer}, passage '#{k}', offset #{offset}"
        "#\{imbroglio.mkLink #{quote target}, #{quote text}}"
      v.prepared = prepare v.mungedSrc, {
        argNames: ['imbroglio']
        thisVar: 'imbroglio.state'
        handleError: (e) ->
          console.log e
          if e.error instanceof Error then throw e.error
          else if e.error then throw new Error e.error
          else throw new Error e
      }
      return
    return
  render = (passage, result = {}) ->
    state = result.state or {}
    delete result.state
    moves = result.moves or= ''
    links = {}
    linkCount = 0
    mkLink = (target, text) ->
      if target not of passages
        return elem 'span', {class: 'error'}, "ERROR: bad link target '#{target}' in passage '#{passage.name}': #{text}"
      else if linkCount >= choiceChars.length
        return elem 'span', {class: 'error'}, "ERROR: too many links, passage '#{passage.name}', target '#{target}': #{text}"
      choiceChar = choiceChars[linkCount++]
      el = elem 'a', {class: 'choice', href: "#!#{moves}#{choiceChar}"}, text
      links[choiceChar] = {el, target}
      return el
    result.passageElem = passage.prepared stdlib {mkLink, state}
    result.choose = (ch) ->
      if not link = links[ch]
        console.log "invalid move #{ch} from passage #{passage.name}"
        return null
      $(link.el).addClass 'chosen'
      return render passages[link.target], {
        moves: "#{moves}#{ch}"
        state
      }
    return result
  return -> render firstPassage

newGame = turn = null

restore = (moves) ->
  if turn?.moves is moves then return
  $('#loading').show()
  $('.pane').hide()
  $('#game').hide()
  $output = $('#output')
  last = ->
    children = $output.children()
    if children.length then $ children.get children.length-1 else children
  if not turn or turn.moves != moves[...turn.moves.length]
    turn = newGame()
    $output.empty()
    $output.append turn.passageElem
  for ch in moves[turn.moves.length...]
    prevTurn = turn
    if not turn = turn.choose ch
      $('#404-pane').show()
      $('#loading').hide()
      return
    turn.prevTurn = prevTurn
    $output.append turn.passageElem
  $output.children().removeClass 'current'
  last().addClass 'current'
  $('#game').show()
  $('#loading').hide()
  $p = $ turn.passageElem
  $chosen = $('.chosen')
  scrollPos = if not $chosen.length then 0 else
    $($chosen.get($chosen.length-1)).offset().top
  console.log "XXX scrollPos = #{scrollPos}"
  window.scrollTo 0, scrollPos
  return

hashchange = ->
  hash = window.location.hash.replace /^#/, ''
  if m = /^!(.*)$/.exec hash then return restore m[1]
  turn = target = null
  if not hash then target = $ '#home'
  else if m = /^\/([a-z][a-z-]*)$/.exec hash then target = $ "##{m[1]}-pane"
  if not target?.length then target = $ '#404-pane'
  $('#game').hide()
  $('#output').empty()
  $('.pane').hide()
  target.show()
  $('#loading').hide()
  window.scrollTo 0, 0
  return

exports.start = (src) ->
  newGame = compile src
  $ ->
    do ->
      m = /([^\/]+)$/.exec window.location?.pathname or ''
      $('a[href="#"], a[href="#/"]').attr 'href', if m then m[1] else '.'
      return
    $(window).on 'hashchange', (e) ->
      e.preventDefault()
      hashchange()
      true
    hashchange()
    return
