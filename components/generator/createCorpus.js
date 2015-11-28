var fs = require('fs');
var Promise = require('bluebird');
var MarkovChain = require('markovchain');
// var quotes = new MarkovChain(fs.readFileSync('./tweets.txt', 'utf8'));

var quotes;

var checkEnding = function(sentence) {
  if (['.','!','?'].indexOf(sentence.slice(-1)) > 1) {
    return true;
  }
  return false;
};

// Create promises
fs = Promise.promisifyAll(fs);

var startwords = [];

var createCorpus = {
  generateCorpus: function(filename) {
    var self = this;
    // Load in text file containing raw Tweet data.
    fs.readFileAsync(filename)
    .then(function(fileContents) {
      //Split content into array, separating by line.
      var content = fileContents.toString().split("\n");
      content = self.cleanContent(content);
      return content;
    })
    .then(function(content){
      //Build word corpus using content array above.
      //return generateCorpus.buildCorpus(content);
      quotes = new MarkovChain(content.join('\n'));
      setInterval(function(){
        var startWord = startwords[Math.floor(Math.random()*startwords.length)];
        console.log(quotes.start(startWord).end(checkEnding).process());
      }, 2000);
      //console.log(content);
    });
  },

  cleanContent: function(content) {
    var cleaned = content;

    cleaned.forEach(function(element, index) {
      // Removing all sorts of weird content found in my tweets that screw this whole process up.
      // Really, I should just get better at RegEx
      var getFirstWord = element.split(' ');
      startwords.push(getFirstWord[0]);

      cleaned[index] = cleaned[index].replace(/(@\S+)/gi,''); // Try to remove any usernames
      cleaned[index] = cleaned[index].replace(/(http\S+)/gi,''); // Try to remove any URLs
      cleaned[index] = cleaned[index].replace(/^RT\W/gi,''); // Remove "RT" -- though we're keeping the rest of the tweet. Should probably fix.
      cleaned[index] = cleaned[index].replace(/( RT )/gi,' '); // Remove "RT" -- though we're keeping the rest of the tweet. Should probably fix.
      cleaned[index] = cleaned[index].replace(/( MT )/g,' '); // Remove "MT" -- though we're keeping the rest of the tweet. Should probably fix.
      cleaned[index] = cleaned[index].replace(/^ +/gm, ''); // Remove any leading whitespace
      cleaned[index] = cleaned[index].replace(/[ \t]+$/, ''); // Remove any trailing whitespace
      cleaned[index] = cleaned[index].replace(/(&#8217;)/, '\''); // Convert HTML entity to apostrophe
      cleaned[index] = cleaned[index].replace(/(&#8216;)/, '\''); // Convert HTML entity to apostrophe
      cleaned[index] = cleaned[index].replace(/\W-$/g, ''); // Remove dashes at the end of a line that result from stripped URLs.
      cleaned[index] = cleaned[index].replace(/&gt;/g, '>'); // Convert greater than signs
      cleaned[index] = cleaned[index].replace(/&lt;/g, '<'); // Convert less than signs
      cleaned[index] = cleaned[index].replace(/&amp;/g,'&'); // Convert HTML entity
      cleaned[index] = cleaned[index].replace(/(\/cc)/gi, ''); // Remove "/cc" from tweets
      cleaned[index] = cleaned[index].replace(/(\/via)/gi, ''); // Remove "/via" from tweets
      cleaned[index] = cleaned[index].replace(/"/g, ''); // Remove quotes
      cleaned[index] = cleaned[index].replace(/“/g, ''); // Remove quotes
      cleaned[index] = cleaned[index].replace(/”/g, ''); // Remove quotes
      cleaned[index] = cleaned[index].replace(/(\))/g, ''); // Hopefully remove parentheses found at end of a word, but not in emojis
      cleaned[index] = cleaned[index].replace(/(\()/g, ''); // Hopefully remove parentheses found at the beginning of a word, but not in emojis
      cleaned[index] = cleaned[index].replace(/(\\n)/gm,''); // Replace all commas in words with nothing.
      //cleaned[index] = cleaned[index].replace(/(\...)/g,'…'); // Save characters and replace three periods… 
      //cleaned[index] = cleaned[index].replace(/[\(]/g, ''); // Remove quotes TODO: figure out how to get rid of these without destroying emojis.  
    });
    return cleaned;
  },

};

module.exports = createCorpus;

filename = "../../tweets.txt";
createCorpus = Promise.promisifyAll(createCorpus);
createCorpus.generateCorpus(filename);