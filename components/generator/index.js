// TEXT GENERATOR!
var config = require('../../config');
var db = require('../../db');

module.exports = {

  // Keep track of all our word stats
  dictionary: {}, // This is a new object I'm using to generate sentences in a more efficient manner than the wordpairs array.
  startwords: [], // Words that start a sentence.
  stopwords: [], // Stop words.
  hashtags: [], // Automatically detect any hashtags that we use.
  wordpairs: [], // This is where we'll store our dictionary of word pairs
  popularKeywords: [], // Track popular keywords that the bot may be interested in based on our tweet history.

  checkSentenceEnd: function(word) {

    // Sometimes, an undefined value is passed in here and we need to properly handle it.
    // Let's just return from the function and do nothing.
    if (word === undefined) {
      return false;
    }

    var endMarks = ['.', '!', '?'];
    var endMark = word.slice(-1);
    if (endMarks.indexOf(endMark) != -1) {
      return true;
    } else {
      return false;
    }
  },

  // Supply an array and randomly pick a word.
  choice: function (array) {
    var randomWord = array[Math.floor(Math.random() * array.length)];
    //console.log(randomWord);
      return randomWord;
  },

  choosePairs: function (firstWord, secondWord) {
    var allResults = [];
    var resultWordPair;
    var getResult;
    if (secondWord === undefined || secondWord === null) {
      getResult = this.searchObject(this.wordpairs, 'first_word', firstWord);
      resultWordPair = getResult[Math.floor(Math.random() * getResult.length)];
      
      //Trying to check for a weird undefined error that sometimes happens and crashes app:
      if (typeof(resultWordPair) == "undefined") {
        //console.log('\n--== ERROR: No result returned... ==--\n')
        allResults[0] = '';
        allResults[1] = '';
        allResults[2] = '';
        allResults[3] = 'end';
        return allResults;      
      }

      allResults[0] = this.checkExists(resultWordPair.word_pair_array[0]);
      allResults[1] = this.checkExists(resultWordPair.word_pair_array[1]);
      allResults[2] = this.checkExists(resultWordPair.next_word);

      return allResults;    
    } else if (secondWord === '') {
      // This means the second word does not exist. Uh, oh!
      //console.log('--== Second word pair not detected. ==--');
      allResults[0] = '';
      allResults[1] = '';
      allResults[2] = '';
      allResults[3] = 'end'; // Send a flag to our sentence generation function that says no more words are detected, so stop.
      return allResults;
    } else {
      getResult = this.searchObject(this.wordpairs, 'word_pair', firstWord + ' ' + secondWord); // Change I to whatever
      resultWordPair = getResult[Math.floor(Math.random() * getResult.length)];

      //Trying to check for a weird undefined error that sometimes happens and crashes app:
      if (typeof(resultWordPair) == "undefined") {
        //console.log('\n--== ERROR: No result returned... ==--\n')
        allResults[0] = '';
        allResults[1] = '';
        allResults[2] = '';
        allResults[3] = 'end';
        return allResults;      
      }

      allResults[0] = this.checkExists(resultWordPair.word_pair_array[0]);
      allResults[1] = this.checkExists(resultWordPair.word_pair_array[1]);
      allResults[2] = this.checkExists(resultWordPair.next_word);

      return allResults;      
    }
  },

  // Clean up our content and remove things that result in poorly generated sentences.
  cleanContent: function(content) {
    var cleaned = content;

    cleaned.forEach(function(element, index) {
      // Removing all sorts of weird content found in my tweets that screw this whole process up.
      // Really, I should just get better at RegEx
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

  makeTweet: function (min_length) {
    if (this.startwords === undefined || this.startwords.length === 0) {
      return;
    }

    var keepGoing = true; // Basically, we want to keep generating a sentence until we either run out of words or hit a punctuation mark.
    var startWord = this.choice(this.startwords); // Get initial start word.
        
    var initialWords = this.choosePairs(startWord); // Choose initial word pair.

    var tweet = [startWord];
    tweet.push(initialWords[1]);
    tweet.push(initialWords[2]);

    while (keepGoing === true) {  
      var getNewWords = this.choosePairs(tweet[tweet.length - 2],tweet[tweet.length - 1]);
      if (getNewWords[3] === 'end') break; // No more words detected. Stop, yo!
      
      tweet.push(getNewWords[2]);
      if (this.checkSentenceEnd(getNewWords[2]) === true) break; // Check if the end of the word contains a sentence ending element.
    }

    // Remove undesireable elements from our array
    var removeElements = function(array, value) {
      if (array.indexOf(value) !== -1) {
        //console.log('REMOVING: ' + value);
        for(var i = array.length-1; i--;){
          if (array[i] === value) array.splice(i, 1);
        }   
      }  
      return array; 
    };

    // Try to remove some random crap that manages to sneak through my earlier filters.
    // I need to be better at regex...
    tweet = removeElements(tweet, '.');
    tweet = removeElements(tweet, '-');
    tweet = removeElements(tweet, 'RT');
    tweet = removeElements(tweet, '/');
    tweet = removeElements(tweet, ':');
    tweet = removeElements(tweet, '[pic]:');
    tweet = removeElements(tweet, '[pic]');

    // Filter our array of words to remove ALL empty values ("", null, undefined and 0):
    tweet = tweet.filter(function(e){return e;}); 

    //console.log(tweet);
    var wholeTweet = tweet.join(' ');

    // Clean up any whitespace added attached to the end up the tweet.
    wholeTweet = wholeTweet.replace(/[ ]*$/g,'');

    // Sometimes, we get erroneous colons at the end of our sentences. Let's remove them.
    // e.g., 'This is happening right now:'
    wholeTweet = wholeTweet.replace(/:$/g,'.'); // Remove colon if found at end of line.
    wholeTweet = wholeTweet.replace(/\,[ ]*$/g,'.'); // Remove comma if found at end of line.
    wholeTweet = wholeTweet.replace(/[ ](w\/)$/g,''); // Remove '/w' that sometimes gets attached to end of lines.

    // For some reason, sometimes our sentence generation returns nothing.
    // Detect if this happens and rerun the script again.
    if (wholeTweet.length === 0) {
      wholeTweet = this.makeTweet(min_length);
    }

    return wholeTweet;
  },

  // I'll be honest. I kind of forget what this method does.
  searchObject: function (array, prop, value) {
    //console.log('SEARCH OBJECT??', array, prop, value);
    var result = array.filter(function (obj) {
      return obj[prop] === value;
    });

    //console.log('SEARCH OBJECT VALUE:', value);
    //console.log('SEARCH OBJECT RESULTS:', result);
    return result;
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

  // Make sure our function spits out phrases less than a certain length.
  twitterFriendly: function (reply, username) {
    var new_tweet;
    if (reply) {
      username = '@' + username + ' ';
    } else {
      username = '';
    }

    do {
      var randomLength = Math.floor((Math.random() * 20) + 10); // Random length between 10 and 20 words.
      new_tweet = this.makeTweet(randomLength);
      new_tweet = username + new_tweet + this.attachHashtag(new_tweet.length); // Randomly add a hashtag
      new_tweet = new_tweet + this.attachEmoji(new_tweet.length); // Randomy add an emoji

    } while (new_tweet.length > 140);

    // TODO: This is a stupid, hacky way to fix weird messages that only say "RT" every so often.
    if (new_tweet == "RT") {
      twitterFriendly(reply, username);
    }
    return new_tweet;
  },

  /*******
  *
  * BUILD SENTENCE FROM KEYWORD?
  *
  */
  chooseRandomPair: function (obj) {

    if (typeof obj === 'undefined') {
      return [''];
    }

    var result = obj[Math.floor(Math.random() * obj.length)];

    // Check if any results are found.
    if (typeof result === 'undefined') {
      //console.log('Error: No object');
      var prev_word = '';
      var cur_word = '';
      var next_word = '';
      var error = 'notfound';

    } else if (typeof result.prev_word !== 'undefined') {
      var prev_word = result.prev_word;
      var cur_word = result.first_word;
      var next_word = result.next_word;
    } else {
      var prev_word = '';
    }
    


    // If we detect an end of sentence in previous word, let's just stop right there.
    if (prev_word.slice(-1) == '.' || prev_word.slice(-1) == '!' || prev_word.slice(-1) == '?') {
      //console.log('End sentence detected');
      prev_word = '';
    }

    // Returns the following array
    // ['prev_word', 'first_word', 'next_word']
    return [prev_word, cur_word, next_word, error];
  },

  findWordPair: function(string) {
    var getResult = this.searchObject(this.wordpairs, 'word_pair', string);
    //console.log( getResult );
    return getResult;
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