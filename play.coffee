choiceChars = 'abcdefghijklmnopqrstuvwxyz0123456789'

error = (msg) -> throw new Error msg
assert = require 'assert'
$ = require 'jquery'
{quote, stdlib, prepare} = require './compiler'
{elem} = stdlib()

normalize = (s) ->
  s
  .replace /^\s+/, ''
  .replace /\s+$/, ''
  .replace /\s+/, ' '

exports.compile = compile = (src) ->
  passages = {}
  firstPassage = null
  do ->
    re = /(?:^\s*\n?|\n\n)#\s*([^\n]*\S)\s*\n/g
    lastPassage = null
    while m = re.exec src
      if lastPassage then lastPassage.endIndex = m.index
      lastPassage = name: normalize(m[1]), startIndex: re.lastIndex
      assert lastPassage.name not of passages, lastPassage.name
      passages[lastPassage.name] = lastPassage
      firstPassage or= lastPassage
    if not lastPassage then error 'no passages found'
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
          error "bad link target '#{target}' at #{outer}, passage #{k}, offset #{offset}"
        "#\{imbroglio.mkLink #{quote target}, #{quote text}}"
      v.prepared = prepare v.mungedSrc, {
        argNames: ['imbroglio']
        thisVar: 'imbroglio.state'
        handleError: (e) ->
          console.log e
          if e.error instanceof Error then throw e.error
          else if e.error then error e.error
          else error e
      }
      return
    return
  render = (passage, result = {}) ->
    moves = result.moves or= ''
    links = {}
    linkCount = 0
    mkLink = (target, text) ->
      if linkCount >= choiceChars.length
        error "too many links, passage #{passage.name}, target [#{target}], text [#{text}]"
      choiceChar = choiceChars[linkCount++]
      el = elem 'a', {class: 'choice', href: "#!#{moves}#{choiceChar}"}, text
      links[choiceChar] = {el, target}
      return el
    state = JSON.parse result.stateJSON or '{}'
    result.passageElem = passage.prepared stdlib {mkLink, state}
    stateJSON = result.stateJSON = JSON.stringify state
    result.choose = (ch) ->
      if not link = links[ch]
        console.log "invalid move #{ch} from passage #{passage.name}"
        return null
      return render passages[link.target], {
        moves: "#{moves}#{ch}"
        chosenElem: link.el
        stateJSON
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
  if not turn
    turn = newGame()
    $output.empty()
    $output.append turn.passageElem
  else
    last = ->
      children = $output.children()
      if children.length then $ children.get children.length-1 else children
    while turn.moves != moves[...turn.moves.length]
      last().remove()
      turn = turn.prevTurn
    last().find('.chosen').removeClass 'chosen'
  for ch in moves[turn.moves.length...]
    prevTurn = turn
    if not turn = turn.choose ch
      $('#404-pane').show()
      $('#loading').hide()
      return
    turn.prevTurn = prevTurn
    $(turn.chosenElem).addClass 'chosen'
    $output.append turn.passageElem
  $('#game').show()
  $('#loading').hide()
  $p = $ turn.passageElem
  window.scrollTo 0, $p.offset().top
  return

hashchange = ->
  hash = window.location.hash.replace /^#/, ''
  if m = /^!(.*)$/.exec hash then return restore m[1]
  turn = target = null
  if m = /^\/([a-z][a-z-]*)$/.exec hash then target = $ "##{m[1]}-pane"
  if not target?.length then target = $('#home')
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
      if m then $('a[href="#"], a[href="#/"]').attr 'href', m[1]
      return
    $(window).on 'hashchange', (e) ->
      e.preventDefault()
      hashchange()
      true
    hashchange()
    return
