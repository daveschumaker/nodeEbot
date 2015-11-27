//var Datastore = require('nedb');
var async = require("async");
var fs = require("fs");
var sqlite3 = require('sqlite3').verbose();
var Promise = require('bluebird');
// Sequelize = deasync(Sequelize);

// Check environment for testing stuff:
if (global.appRootPath) {
  var file = appRootPath + "/db/corpus.sqlite";
} else {
  var file = "corpus.sqlite";
}

var schema = require('./schema.js');
var exists = fs.existsSync(file);
var db = new sqlite3.Database(file);

db.serialize(function() {
  if(!exists) {
    db.run(schema.word_dictionary());
    db.run(schema.start_words());
    db.run(schema.end_words());
    db.run(schema.hashtags());
  }
});

//var db = new Datastore({ filename: appRootPath + '/db/corpus.db', autoload: true });
//var db = new Datastore({ filename: 'corpus.db', autoload: true });
//db.ensureIndex({fieldName : 'word'});

var databaseActions = {
  addWord: function(obj, action) {
    var sql, valueArray;
    action = action || 'keyword';

    if (action === 'keyword') {
      sql = "INSERT INTO word_dictionary (keyword, next_1, next_2, next_3, prev_1, prev_2, prev_3) VALUES (?,?,?,?,?,?,?)";
      valueArray = [
        obj.word,
        obj.next_words[0],
        obj.next_words[1],
        obj.next_words[2],
        obj.prev_words[0],
        obj.prev_words[1],
        obj.prev_words[2]
      ];
    } else if (action === 'startword') {
      sql = "INSERT INTO start_words (keyword) VALUES (?)";
      valueArray = [obj.word];
    } else if (action === 'endword') {
      sql = "INSERT INTO end_words (keyword) VALUES (?)";
      valueArray = [obj.word];
    } else if (action === 'hashtag') {
      sql = "INSERT INTO hashtags (keyword) VALUES (?)";
      valueArray = [obj.word];
    }
    
    //console.log('[ADDING]', valueArray);
    db.run(sql,valueArray);

  },
  getRandomWord: function(type, keyword, callback) {
    type = type || 'keyword';
    var sql, result;

    if (type === 'keyword') {
      sql = "SELECT * FROM word_dictionary WHERE keyword = ? ORDER BY RANDOM() LIMIT 1";
      db.all(sql, keyword, function(err,rows){
        //rows contain values while errors, well you can figure out.
        callback(rows[0]);
      });      
    } else if (type === 'startword') {
      sql = "SELECT * FROM start_words ORDER BY RANDOM() LIMIT 1";
      db.all(sql, function(err,rows){
        //rows contain values while errors, well you can figure out.
        callback(rows[0]);
      });
    }


  },
  find: function(obj) {
    db.find(obj, function(err, docs) {
      console.log(docs);
      //return docs;
    });
  }
};

Promise.promisifyAll(databaseActions);
module.exports = databaseActions;

var results = [];
var callback = function(result) {
  var curWord;

  if (result === undefined) {
    //console.log('Undefined');
    console.log(results.join(' '));
    return;
  }

  if (results.length === 0) {
    curWord = result.keyword;
  } else {
    curWord = result.next_1;
  }

  results.push(curWord);
  // console.log(result);

  if (results.length < 10) {
    databaseActions.getRandomWord('keyword', curWord, callback);    
  } else {
    console.log(results.join(' '));
    return;
  }

};

databaseActions.getRandomWord('startword', null, callback);

// TODO: Depending on action, change query
// hashtags, startwords, etc.

// TODO: Break out generator into it's own script!
// Example: Run "npm create corpus"
// Detect if user hasn't run it before
// This is useful for now parsing twitter CSV!!

//databaseActions = Promise.promisifyAll(databaseActions);

// db.find({"word":"tweets"}, function(err, docs) {
//   console.log(docs);
// });

//databaseActions.find({'word':'Dave'})