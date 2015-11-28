// SQLite is dumb and will only execute one CREATE TABLE statement at a time.
// Export these methods to that we can individually create tables on first boot.

module.exports = {
  word_dictionary: function() {
    var sql =  "CREATE TABLE word_dictionary (" +
    "keyword TEXT, " +
    "next_1 TEXT, " +
    "next_2 TEXT, " +
    "next_3 TEXT, " +
    "prev_1 TEXT, " +
    "prev_2 TEXT, " +
    "prev_3 TEXT" +
    ");" +
    "CREATE INDEX index_word ON word_dictionary (keyword);";

    return sql;
  },
  start_words: function() {
    var sql = "CREATE TABLE start_words (keyword TEXT);" +
      "CREATE INDEX index_word ON start_words (keyword);";
    return sql;
  },
  end_words: function() {
    var sql = "CREATE TABLE end_words (keyword TEXT);" +
      "CREATE INDEX index_word ON end_words (keyword);";
    return sql;
  },
  hashtags: function() {
    var sql = "CREATE TABLE hashtags (keyword TEXT);" +
      "CREATE INDEX index_word ON hashtags (keyword);";
    return sql;
  },
  popular_words: function() {
    var sql =  "CREATE TABLE popular_words (" +
    "keyword TEXT UNIQUE, " +
    "count INTEGER" +
    ");" +
    "CREATE INDEX index_word ON popular_words (keyword);";
    return sql;
  }
};