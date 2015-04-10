fs = require 'fs'
src = fs.readFileSync "#{__dirname}/game.txt", 'utf8'
{play} = require '.'
play src
