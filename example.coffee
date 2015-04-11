fs = require 'fs'
src = fs.readFileSync "#{__dirname}/game.txt", 'utf8'
imbroglio = require '.'
imbroglio.play.start src
