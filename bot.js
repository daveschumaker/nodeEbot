/**
* nodeEbot v.0.2.0! 
* A twitter_ebooks style bot for Node.js
* by Dave Schumaker (@davely)
* https://github.com/daveschumaker/nodeEbot
*
* Heavily inspired by the following twitter_ebooks project for Ruby by Mispy:
* https://github.com/mispy/twitter_ebooks
*/

/*
*   Import the robot component.
*   This is where all the business logic is handeled.
*/
var fs = require("fs");
var sqlite3 = require("sqlite3").verbose();

var robot = require('./components/robot');
var databaseFilename = './db/corpus.sqlite';

var exists = fs.existsSync(databaseFilename);
var db = new sqlite3.Database(databaseFilename);

db.serialize(function() {
  if(!exists) {
    db.run("CREATE TABLE Stuff (thing TEXT)");
  }
  
  var stmt = db.prepare("INSERT INTO Stuff VALUES (?)");
  
  //Insert random data
  var rnd;
  for (var i = 0; i < 10; i++) {
    rnd = Math.floor(Math.random() * 10000000);
    stmt.run("Thing #" + rnd);
  }
  
  stmt.finalize();
});

// Fire up the robot!
robot.init();