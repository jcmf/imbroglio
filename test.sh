#!/bin/sh
node -e 'var failed = false; require("./play").compile(require("fs").readFileSync("game.txt", "utf8"), {handleError: function(msg) {console.log(msg); failed = true;}}); if(failed) throw new Error("failed");'
