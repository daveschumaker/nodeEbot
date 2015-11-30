// TEXT GENERATOR!
var config = require('../../config');
var db = require('../../db');

var tweetGenerator = {
  testCB: function() {
    console.log('Poop stix!');
  },
  makeTweet: function (cbReturnTweet) {
    var self = this;
    var endSentence = false;
    var sentences = [];
    var results = [];

    var callback2 = function(result) {
      var curWord, newSentence, getLength, nextSearchKeyword, nextSearchSecondWord;

      //console.log('[RESULT WORD OBJ]', result);

      // Detect no results to start. Restart this whole process!
      if (result === false) {
        db.getRandomWord('startword', null, null, callback);
      }

      if (result === undefined) {
        //console.log('Undefined');
          newSentence = results.join(' ');
          getLength = newSentence.length;
          // console.log(newSentence + ' [' + getLength + ' chars / UNDEFINED]');
          // self.detectUndefined(newSentence);
          // console.log('[RESULT ARRAY 1]', results);
          results = [];
          cbReturnTweet(newSentence);
          return; 
      }

      if (results.length === 0) {
        if (result.keyword !== null) {
          results.push(result.keyword);
          nextSearchKeyword = result.next_1;
          if (result.next_1 !== null) {
            results.push(result.next_1);
            nextSearchSecondWord = result.next_2;
          }
          curWord = result.keyword;
        }
      } else {

        // Sometimes, null values will sneak into our sentence and the word
        // "undefined" will suddenly appear in our tweet. 
        if (result.next_1 !== null) {
          nextSearchKeyword = result.next_1;

          // Try to fix weird duplication issue...
          if (result.next_1 !== results[results.length - 1]) {
            results.push(result.next_1);
          }

          //curWord = result.next_1;
        } 
        // if (result.next_2 !== null) {
        //   results.push(result.next_2);
        //   curWord = result.next_2;
        // }
        // if (result.next_3 !== null) {
        //   results.push(result.next_3);
        //   curWord = result.next_3;
        // } 

        // Testing new functionality with WORD PAIRS
        if (result.next_2 !== null) {
          
          results.push(result.next_2);
          curWord = result.next_2;
          nextSearchSecondWord = result.next_2;
        }           
      }

      var lastWordAdded = results[results.length-1];
      // Check if this is the end of a sentence.
      if (self.checkSentenceEnd(lastWordAdded)) {
        //console.log('End of sentence detected!');
        //sentences.push(results.join(' '));
        //results = [];
        endSentence = true;

        if (!self.checkMakeNewSentence()) {
          newSentence = results.join(' ');
          getLength = newSentence.length;
          // console.log(newSentence + ' [' + getLength + ' chars]');
          // self.detectUndefined(newSentence);
          // console.log('[RESULT ARRAY 2]', results);
          results = [];
          cbReturnTweet(newSentence);
          return;
        }
      } else {
        //console.log('hi?');
        endSentence = false;
      }

      if (results.join(' ').length > 140) {
        // Sentence too long, get out of here and start over.
        results = [];
        db.getRandomWord('startword', null, null, callback);
        return;
      }

      if (results.join(' ').length < 40 || !endSentence) {
        //db.getRandomWord('keyword', curWord, results.prev_1, callback);    
        db.getWordPair(nextSearchKeyword, nextSearchSecondWord, callback);
      } else {
          newSentence = results.join(' ');
          getLength = newSentence.length;
          // console.log(newSentence + ' [' + getLength + ' chars]');
          // self.detectUndefined(newSentence);
          // console.log('[RESULT ARRAY 3]', results);
          results = [];
          cbReturnTweet(newSentence);
          return;
      }

    };

    db.getRandomWord('startword', null, null, callback);  
  },

  // Check if punctuation noting the end of a sentence is found at the end of a word.
  checkSentenceEnd: function(word) {
    if (word && ['!', '?', '.', '…'].indexOf(word.slice(-1)) > -1) {
      return true;
    }
    return false;
  },
  // Check whether or not to keep building a sentence.
  checkMakeNewSentence: function() {
    if (Math.random() < 0.75) {
      return true;
    }
    return false;
  },
  detectUndefined: function(sentence) {
    // Hacky way to try and detect "undefined" word that keeps popping up at end of sentences.
    if (sentence.slice(-9) === 'undefined') {
      sentence = sentence.slice(0, sentence.length - 9);
    }
    return sentence;
  },

  // Random add a hashtag to the end of our tweet.
  attachHashtag: function(tweetlength) {
    var gethashtag;
    var x = Math.random(); // Generate random number to determine whether we add a hashtag or not
    if (x <= config.personality.addHashtags) {
      // Pick a random emoji from our array
      gethashtag = this.hashtags[Math.floor(Math.random()*this.hashtags.length)];
    
      // Fix error checking when hashtags might not exist.
      if (typeof gethashtag == 'undefined') {
        gethashtag = '';
      }

      // Check if we should be ignoring this hashtag before we include it.
      if (config.personality.ignoredHashtags.indexOf(gethashtag.toLowerCase()) !== -1) {
        //console.log('Ignoring the following hashtag: ' + gethashtag);
        gethashtag = '';
      } else if (typeof gethashtag == 'undefined') {
        console.log('\nUndefined hashtag detected');
        gethashtag = '';
      } else {
        // Add padding to hashtag
        gethashtag = ' ' + gethashtag;
      }

    } else {
      gethashtag = '';
    } 


    if (tweetlength < 120) {
      return gethashtag;
    }  
  },

  // Let's randomly include an emoji at the end of the tweet.
  attachEmoji: function(tweetlength) {
    var emoji;
    var emojis = [
      " 💩💩💩",
      " 😍😍",
      " 💩",
      " 😐",
      " 😝",
      " 😖",
      " 😎",
      " 😘",
      " 😍",
      " 😄",
      " 👍",
      " 👎",
      " 👊",
      " 🌟",
      " 🌟🌟🌟",
      " 😵",
      " 😡",
      " 🙀",
      " 🍺",
      " ❤",
      " 💔",
      " 🏃💨 💩"
    ];

    var x = Math.random(); // Generate random number to determine whether we show emoji or not
    if (x <= config.personality.addEmojis) {
      // Pick a random emoji from our array
      emoji = emojis[Math.floor(Math.random()*emojis.length)];
    } else {
      emoji = '';
    }

    if (tweetlength < 130) {
      return emoji;
    }
  },

};
var callback = tweetGenerator.testCB;
module.exports = tweetGenerator;