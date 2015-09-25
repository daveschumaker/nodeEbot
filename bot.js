/**
* nodeEbot v.2.0.0! 
* A twitter_ebooks style bot for Node.js
* by Dave Schumaker (@davely)
*
* Heavily inspired by the twitter_ebooks project for Ruby by Mispy
* https://github.com/mispy/twitter_ebooks
*/

// Import required modules to make our robot work!
var fs = require('fs');
var util = require('util');
var Twitter = require('twitter');
var Promise = require('bluebird');

// Import configuration settings and API keys
var config = require('./config/config.js');

// Import generator for creating new sentences!
var generator = require('./generator');

// Create promises
//fs = Promise.promisifyAll(fs);
//generator = Promise.promisifyAll(generator);

/////////////////////

// Filename to source or tweets and other content from?
tweetFile = 'tweets.txt';

// RAW CONTENT!
// Load files that contain all relevant tweets, stopwords, etc
var content = fs.readFileSync(tweetFile).toString().split("\n");
var processed = generator.buildCorpus(content);

// fs.writeFile('processed_data.txt', util.inspect(processed, false, null), function (err,data) {
//   if (err) {
//     return console.log(err);
//   }
//   console.log(data);
// });

setInterval(function() {
  console.log(generator.makeTweet(140) + '');
}, 750);

// var content;

// fs.readFileAsync(tweetFile)
// .then(function(fileContents) {
//   //console.log("Get file contents");
//   content = fileContents.toString().split("\n");
//   //console.log(content);
//   return content;
// })
// .then(function(content){
//   //console.log("Build Corpus");
//   return generator.buildCorpus(content);
// })
// .then (function(data){
//   //console.log("Make Tweet!!");
//   // setInterval(function() {
//   //   console.log(generator.makeTweet(140) + '\n');
//   // }, 2500);  
  
//   return generator.makeTweet(140);
// })
// .then(function(tweet){
//   console.log('NEW TWEET:', tweet);
// });

// Generate corpus
/*
generator.buildCorpusAsync(content)
  .then(function(data) {
    console.log('hey');
  });
*/
//console.log(generator.makeTweet(140));
//console.log(corpus);