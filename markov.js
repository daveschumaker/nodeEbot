var MarkovChain = require('markovchain')
  , fs = require('fs')
  , quotes = new MarkovChain(fs.readFileSync('./tweets.txt', 'utf8'))

var stopAfterFiveWords = function(sentence) {
  return sentence.split(" ").length >= 5;
};

var checkEnding = function(sentence) {
  if (['.','!','?'].indexOf(sentence.slice(-1)) > 1) {
    return true;
  }
  return false;
};

setInterval(function() {
  console.log(quotes.start('The').end(checkEnding).process());
}, 1500);
