//var Datastore = require('nedb');
var async = require("async");
var fs = require("fs");
var sqlite3 = require('sqlite3').verbose();

// Check environment for testing stuff:
if (global.appRootPath) {
  var file = appRootPath + "/db/corpus.sqlite";
} else {
  var file = "corpus.sqlite";
}

var schema = require('./schema.js');
var exists = fs.existsSync(file);
var db = new sqlite3.Database(file);

var databaseActions = {
  initDB: function(callback) {
    db.serialize(function() {
      if(!exists) {
        db.run(schema.word_dictionary());
        db.run(schema.start_words());
        db.run(schema.end_words());
        db.run(schema.hashtags());
        db.run(schema.popular_words());
        callback();
      }
    });
  },
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
  getRandomWord: function(type, keyword, prevword, callback) {
    type = type || 'keyword';
    var sql, result;

    if (type === 'keyword') {
      if (prevword) {
        sql = "SELECT * FROM word_dictionary WHERE keyword = ? AND prev_1 = ? ORDER BY RANDOM() LIMIT 1";
        keyword = [keyword, prevword];
      }
      sql = "SELECT * FROM word_dictionary WHERE keyword = ? ORDER BY RANDOM() LIMIT 1";
      db.all(sql, keyword, function(err,rows){
        //rows contain values while errors, well you can figure out.
        callback(rows[0]);
      });      
    } else if (type === 'startword') {
      // TODO: Need more efficient way to do this. Can probably combine SQL statements to eliminate callback hell.
      sql = "SELECT * FROM start_words ORDER BY RANDOM() LIMIT 1";
      db.all(sql, function(err,rows){
        var resultKeyword = rows[0].keyword;
        var startwordQuery = "SELECT * FROM word_dictionary WHERE keyword = ? ORDER BY RANDOM() LIMIT 1";
        db.all(startwordQuery, resultKeyword, function(err, rows) {
          callback(rows[0]);
        });
      });
    }
  },
  getWordPair: function(keyword, secondWord, callback) {
    //console.log('[WORDS]', keyword, secondWord);
    if (secondWord === undefined) {
      //console.log('second word no results', keyword, secondWord);
      return false;
    }

    sql = "SELECT * FROM word_dictionary WHERE keyword = ? AND next_1 = ? ORDER BY RANDOM() LIMIT 1";
    keyword = [keyword, secondWord];

    db.all(sql, keyword, function(err,rows){
      //rows contain values while errors, well you can figure out.
      //console.log('[RESULT]:', rows[0]);
      callback(rows[0]);
    });    
  },
  updatePopularWord: function(keyword) {
    var sql = "SELECT * FROM popular_words WHERE keyword = ?";
    var count;
    db.all(sql, keyword, function(err, rows) {
      if (rows !== undefined) {
        count = rows[1];
        count++;
      } else {
        count = 1;
      }
      var updateSql = 'INSERT OR REPLACE INTO popular_words (keyword, count) VALUES (?,?);';        
      db.run(updateSql, [keyword, count]);
    });
  }
};

module.exports = databaseActions;