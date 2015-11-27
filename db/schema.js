// SQLite is dumb and will only execute one CREATE TABLE statement at a time.

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
  }
};