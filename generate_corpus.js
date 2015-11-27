var fs = require('fs');
var Promise = require('bluebird');
var path = require('path');
global.appRootPath = path.resolve(__dirname);

var config = require('./config');
var db = require('./db');

// Filename to source or tweets and other content from?
tweetFile = 'tweets.txt';

// Create promises
fs = Promise.promisifyAll(fs);

var generateCorpus = {
  // Build out initial word pair dictionary for creating
  // semi-intelligent sounding sentences pseudo Markov chains.
  buildCorpus: function(content) {

    // This for-loop will iterate over every single line of text that's passed in from the "content" argument.
    // This will be text that's cleaned up and formatted correctly after the server / bot reads data from
    // our tweets.txt file. In the case below, content[currentLine] will represent one line of text.
    // Example: content[currentLine] === "Oh, man. I'm really hungry!"
    for (var currentLine = 0; currentLine < content.length; currentLine++) {

        // In order to start properly building our corpus of processed text, 
        // we're going to need to split up each word in our sentence individually into an array.
        // Since we're splitting on spaces between words, this will attach punctuation marks and the like.
        // This is something we actually want! We can check for "end" words and stuff later.
        // Example: ['Oh,', 'man.', 'I\'m', 'really', 'hungry!']
        var words = content[currentLine].split(' ');

        // We want our robot to sound intelligent, we track words that start each sentence (new line).
        // There are some cases where this currently falls apart. The above example is good. The only
        // startword that would be pushed to the array would be "Oh" and not "I'm", since we're not checking
        // for where sentences get split up.
        db.addWord({word: words[0]}, 'startword');

        // Now, we're going to iterate over all the words we've found in our currentLine,
        // which is all the stuff we pushed in the new words array up above. 
        // Let's start adding real data to our dictionary!
        for (var j = 0; j < words.length - 1; j++) {

            // TODO: I forget what this does...
            var checkValid = true; // Flag to check whether a value is true or false.

            // This specifically checks if the current word is a hashtag,
            // so that we can add it to a special array for later use.
            // For example, maybe we'll want to attach completely random hashtags
            // to our sentences. #blessed
            if (words[j].substring(0, 1) === "#") {
              var tempHashtag = words[j];
              tempHashtag = tempHashtag.replace(/[\W]*$/g,''); // Remove any cruft found at end of hashtag.
              db.addWord({word: tempHashtag}, 'hashtag');
            }

            // Make sure our word isn't an empty value. No one likes that. Not even you.
            if (words[j] !== '' && checkValid === true) {          

              // NOTE: This is the current way we're storing data in our word dictionary. 
              // We simply add this object to an array. This means multiple objects will exist
              // that feature the same object. It's really inefficient and long term, I want to
              // improve how this works.
              var wordObject = {
                word: words[j],
                next_words: [(words[j+1]), (words[j+2]), (words[j+3])],
                prev_words: [(words[j-1]), (words[j-2]), (words[j-3])]
              };

              console.log('[ADDING]', wordObject);
              db.addWord(wordObject, 'keyword');
            }
        }
    }

    return;
  },
};

generateCorpus = Promise.promisifyAll(generateCorpus);

// Load in text file containing raw Tweet data.
fs.readFileAsync(tweetFile)
.then(function(fileContents) {
  //Split content into array, separating by line.
  var content = fileContents.toString().split("\n");
  return content;
})
.then(function(content){
  //Build word corpus using content array above.
  return generateCorpus.buildCorpus(content);
});