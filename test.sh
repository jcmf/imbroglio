#!/bin/sh
node -e 'require("./play").compile(require("fs").readFileSync("game.txt", "utf8"))'
