choiceChars = '0123456789abcdefghijklmnopqrstuvwxyz'

error = (msg) -> throw new Error msg

mkText = (s) -> window.document.createTextNode s
mkElem = (tag, children = [], attrs = {}) ->
  result = window.document.createElement tag
  result.setAttribute k, v for k, v of attrs
  result.appendChild child for child in children when child
  result

newGame = do ->
  src = require('fs').readFileSync "#{__dirname}/game.txt", 'utf8'
  passages = {}
  firstPassage = null
  do ->
    re = /(?:^|\n\n)#\s+([^\n]*\S)\n/g
    lastPassage = null
    while m = re.exec src
      if lastPassage then lastPassage.endIndex = m.index
      lastPassage = name: m[1], startIndex: re.lastIndex
      assert lastPassage.name not of passages, lastPassage.name
      passages[lastPassage.name] = lastPassage
      firstPassage or= lastPassage
    lastPassage.endIndex = src.length
  do ->
    for k, v of passages then do ->
      v.src = src.substring v.startIndex, v.endIndex
      re = /\[\[([^\]]*)\]\]|(\n\n)/g
#      index = 0
#      v.pp = pp = [p = []]
#      linkCount = 0
#      while m = re.exec v.src do ->
#        if m.index != index
#          p.push
#            text: v.src.substring index, m.index
#            startIndex: v.startIndex + index
#            endIndex: v.startIndex + m.index
#        index = re.lastIndex
#        if m[2]
#          pp.push p = []
#          continue
#        link = m[1]
#        offset = v.startIndex + m.index
#        if not lm = /(.*)->([^\s<>]+)/.exec link
#          error "malformed link [[#{link}]], passage #{k}, offset #{offset}"
#        if linkCount >= choiceChars.length
#          error "too many links, passage #{k}, offset #{offset}"
#        if m[2] not of passages
#          error "bad link target #{m[2]}, passage #{k}, offset #{offset}"
#        p.push {
#          text: m[1]
#          target: m[2]
#          choiceChar: choiceChars[linkCount++]
#          startIndex: v.startIndex + m.index
#          endIndex: v.startIndex + index
#        }
#      if index != v.src.length
#        p.push
#          text: v.src.substring index
#          startIndex: v.startIndex + index
#          endIndex: v.startIndex + v.src.length
#      if not p.length then pp.pop()
#      if not pp.length then error "empty passage #{k}, offset #{v.startIndex}"
#  render = (passage, attrs = {}) ->
#    moves = attrs.moves or= ''
#    links = {}
#    children = do -> for p in passage.pp
#      grandchildren = for item in p
#        gchild = mkText item.text
#        if item.target
#          gchild = mkElem 'a', grandchild,
#            href: "#{moves}#{item.choiceChar}"
#            class: 'choice'
#          assert item.choiceChar
#          assert not links[item.choiceChar]
#          links[item.choiceChar] =
#            el: gchild
#            target: item.target
#        gchild
#      mkElem 'p', grandchildren
#    attrs.passageElem = mkElem 'div', children, class: 'passage'
#    attrs.choose = (ch) ->
#      if not link = links[ch]
#        console.log "invalid move #{ch} from passage #{passage.name}"
#        return null
#      render passages[link.target], moves: "#{moves}#{ch}", chosenElem: link.el
#  return -> render firstPassage

game = null

restore = (moves) ->
  if game?.moves is moves then return
  $('#loading').show()
  $('.pane').hide()
  $('#game').hide()
  $output = $('#output')
  if not game
    game = newGame()
    $output.empty()
  else
    last = ->
      children = $output.children()
      if children.length then $ children.get children.length-1 else children
    while game.moves != moves[...game.moves.length]
      last().remove()
    last().find('.chosen').removeClass 'chosen'
  for ch in moves[game.moves.length...]
    if not game = game.choose ch
      $('#404-pane').show()
      $('#loading').hide()
      return
    $(game.chosenElem).addClass 'chosen'
    $output.append game.passageElem
  $('#game').show()
  $('#loading').hide()
  $p = $ game.passageElem
  window.scrollTo 0, $p.offset().top - $p.css 'margin-top'

hashchange = ->
  hash = window.location.hash.replace /^#/, ''
  return restore hash m[1] if m = /^!(.*)$/.exec hash
  game = target = null
  if m = /^\/([a-z][a-z-]*)$/.exec hash then target = $("##{m[1]}-pane")
  if not target?.length then target = $('#home')
  $('#game').hide()
  $('#output').empty()
  $('.pane').hide()
  target.show()
  window.scrollTo 0, 0

$ ->
  $(window).on 'hashchange', (e) ->
    e.preventDefault()
    hashchange()
    true
  hashchange()
