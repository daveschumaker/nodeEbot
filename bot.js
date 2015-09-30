/**
* nodeEbot v.0.2.0! 
* A twitter_ebooks style bot for Node.js
* by Dave Schumaker (@davely)
* https://github.com/daveschumaker/nodeEbot
*
* Heavily inspired by the following twitter_ebooks project for Ruby by Mispy:
* https://github.com/mispy/twitter_ebooks
*/

// Import required npm modules to make our robot work!
var fs = require('fs');
var util = require('util');
var Promise = require('bluebird');

// Import configuration settings and API keys
var config = require('./config');

// Import generator for building word dictionary and
// creating new sentences
var generator = require('./generator');

// Custom Twitter actions.
var tweet = require('./tweets');

// Helper functions
var utils = require('./utilities');

// Create promises
fs = Promise.promisifyAll(fs);
generator = Promise.promisifyAll(generator);

/////////////////////
// Process stopwords.
generator.stopwords = fs.readFileSync('./data/stopwords.txt').toString().split("\n");

// Filename to source or tweets and other content from?
tweetFile = 'tweets.txt';

// Start watching the Twitter stream.
tweet.watchStream();

// RAW CONTENT!
fs.readFileAsync(tweetFile)
.then(function(fileContents) {
  //console.log("Get file contents");
  var content = fileContents.toString().split("\n");
  //console.log(content);
  return content;
})
.then(function(content){
  //console.log("Build Corpus");
  return generator.buildCorpus(content);
})
.then(function(data){
  var newTweet = generator.makeTweet(140);
  tweet.postNewTweet(newTweet);
  console.log('JUST TWEETED!\n', utils.currentTime(), newTweet);

  // setInterval(function() {
  //   console.log(utils.currentTime(), generator.makeTweet(140) + '');
  // }, 500);  
  
  //return generator.makeTweet(140);
});