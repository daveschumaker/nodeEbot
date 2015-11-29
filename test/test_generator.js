var path = require('path');
global.appRootPath = '..';

var generator = require('../components/generator'); // Compiles word dictionary and builds new sentences.
var utils = require('../components/utilities');

// Test quality of generated tweets
setInterval(function() {
  generator.makeTweet(function(newTweet) {
    newTweet = newTweet + generator.attachEmoji(newTweet.length);
    newTweet = generator.detectUndefined(newTweet);
    console.log('['+utils.currentTime()+']', newTweet + '');     
  });
}, 1500);
