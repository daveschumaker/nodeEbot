// TEXT GENERATOR!
var config = require('../../config');
var db = require('../../db');

var tweetGenerator = {
  makeTweet: function (cbReturnTweet) {
    var endSentence = false;
    var sentences = [];
    var results = [];

    // Check whether or not to keep building a sentence.
    var keepGoing = function() {
     if (Math.random() < 0.6) {
        return true;
     }

     return false;
    };

    var callback = function(result) {
      var curWord, newSentence, getLength;

      if (result === undefined) {
        //console.log('Undefined');
          newSentence = results.join(' ');
          getLength = newSentence.length;
          // console.log(newSentence + ' [' + getLength + ' chars / UNDEFINED]');
          results = [];
          cbReturnTweet(newSentence);
          return; 
      }

      if (results.length === 0) {

        curWord = result.keyword;
        results.push(curWord);
      } else {
        results.push(result.next_1, result.next_2, result.next_3);
        curWord = result.next_3;
      }


      // Check if this is the end of a sentence.
      if (curWord && ['!', '?', '.', '…'].indexOf(curWord.slice(-1)) > -1) {
        //console.log('End of sentence detected!');
        //sentences.push(results.join(' '));
        //results = [];
        endSentence = true;

        if (!keepGoing()) {
          newSentence = results.join(' ');
          getLength = newSentence.length;
          // console.log(newSentence + ' [' + getLength + ' chars]');
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
        db.getRandomWord('keyword', curWord, results.prev_1, callback);    
      } else {
          newSentence = results.join(' ');
          getLength = newSentence.length;
          // console.log(newSentence + ' [' + getLength + ' chars]');
          results = [];
          cbReturnTweet(newSentence);
          return;
      }

    };

    db.getRandomWord('startword', null, null, callback);  
  },

  // Find all keywords in our word pair dictionary
  getKeywords: function(word) {
    var checkStopword = word.toLowerCase().replace(/[\W]*$/g,''); // Remove any cruft found at end of word.

    // Before we begin, let's check if the word is a stopword found in
      // our stopwords.txt file. If so, we're going to ignore it.
      if (this.stopwords.indexOf(checkStopword) == -1 && word !== '') {
        var result = this.wordpairs.filter(function( obj ) {
            //tempIndex = wordpairs.indexOf(obj);
            //console.log(wordpairs.indexOf(obj));
            return obj.first_word == word;
        });     

        //console.log('Total results: ' + result.length);
        //console.log(result);

        return [result.length, word, result];
      } else {
        //console.log('Word in stopword list: ' + word);
        return '';
      }
  },

  makeSentenceFromKeyword: function(replystring) {  
    var allWords = []; // Our array of all words.
    var mySentence = []; // Store words we find in this array.
    allWords = replystring.split(' ');

    // Pass in proper context to the calculateHighest function
    var self = this;

    // Calculate highest keyword
    function calculateHighest(allWords) {
      var count = 0;
      var highestWord;
      var resultArray = [];

      for (var i = 0; i < allWords.length; i++) {
        //console.log('Getting results for: ' + feederArray[i]);
        var result = self.getKeywords(allWords[i]);
        if (result[0] > count) {
          count = result[0];
          highestWord = result[1];
          resultArray = result[2];
        }
      }

      //console.log('\nHighest ranked word in corpus is: \'' + highestWord + '\' and was found ' + count + ' times.');
      //console.log(resultArray); 
      return resultArray;
    }

    //console.log('Testing ranking:');
    //console.log(calculateHighest(allWords));
    
    var keywordObject = calculateHighest(allWords);
    
    var keepGoing = true; // Keep generating our sentence until we no longer have to.
    //console.log(obj);
    // Choose random result
    var result = keywordObject[Math.floor(Math.random() * keywordObject.length)];
    
    //console.log(result);

    // Error checking to handle undefined / unfound words.
    if (typeof result == 'undefined') {
      //console.log('\nError: No matching keywords found.');
      return;
    }

    var prev_word = result.prev_word;
    var cur_word = result.first_word;

    // Add intial words to array.
    mySentence.push(prev_word, cur_word);

    // First part of our "Build Sentence from Keyword" Function
    // This generates everything BEFORE our keyword.
    while (keepGoing === true) {
      var cur_wordpair = mySentence[0] + ' ' + mySentence[1];
      var tempArray = this.chooseRandomPair(this.findWordPair(cur_wordpair));

      // Check if an error condition exists and end things
      if (tempArray[3] == 'notfound') {
        console.log('\nError: No keyword pairs found');
        return;
      }

      if (tempArray[0] === '') {
        keepGoing = false;
      } else {
        mySentence.unshift(tempArray[0]);
      }
    }

    // Second part of our "Build Sentence from Keyword" Function
    // This generates everything AFTER our keyword.
    keepGoing = true; // Reset our keep going variable.
    while (keepGoing === true) {
      var arrayLength = mySentence.length - 1;
      var cur_wordpair = mySentence[arrayLength - 1] + ' ' + mySentence[arrayLength];
      var tempArray = this.chooseRandomPair(this.findWordPair(cur_wordpair));

      // Check if an error condition exists and end things
      if (tempArray[3] == 'notfound') {
        console.log('\nError: No keyword pairs found');
        return;
      }

      if (tempArray[2] === '') {
        keepGoing = false;
      } else {
        mySentence.push(tempArray[2]);
      }
    }  

    // Run this again until we have a sentence under 124 characters.
    // This is because the max length of Twitter username is 15 characters + 1 space.
    // TODO: Imporve this so we can count the username we're replying to.

    if (mySentence.join(' ').length > 124) {
      makeSentenceFromKeyword(replystring);
    } else {
      // TODO: Better error handling when we return no object.
      //console.log('\nGenerated response: ' + allWords.join(' '));
      //console.log('(' + allWords.join(' ').length + ' characters.)');   
      
      var returnSentence = mySentence.join(' ');

      if (typeof returnSentence == 'undefined') {
        console.log('\nError: No valid replies found');
        return;
      } else {
        return mySentence.join(' ');
      }
    }
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

module.exports = tweetGenerator;