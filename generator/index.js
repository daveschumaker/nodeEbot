// TEXT GENERATOR!
module.exports = {
  // Keep track of all our word stats
  dictionary: {}, // This is a new object I'm using to generate sentences in a more efficient manner than the wordpairs array.
  startwords: [], // Words that start a sentence.
  hashtags: [], // Automatically detect any hashtags that we use.
  wordpairs: [], // This is where we'll store our dictionary of word pairs
  popularKeywords: [], // Track popular keywords that the bot may be interested in based on our tweet history.

  // Build out initial word pair dictionary for creating
  // semi-intelligent sounding sentences pseudo Markov chains.
  buildCorpus: function(content) {
    var countWords = 0;

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
        this.startwords.push(words[0]);

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
              this.hashtags.push(tempHashtag);
            }

            // Make sure our word isn't an empty value. No one likes that. Not even you.
            if (words[j] !== '' && checkValid === true) {

              // New method for tracking words...
              // Check if the word even exists in our array.
              // If not, let's add it and then build in our template.
              if (!this.dictionary[words[j]]) {
                this.dictionary[words[j]] = {
                  count: 1,
                  next_words: [],
                  prev_words: [],
                };
              } else {
                // Word already exists in our dictionary. Let's update some stuff!
                this.dictionary[words[j]].count++;
              }             

              var curWord = {
                first_word: words[j],
                word_pair: words[j] + ' ' + this.checkExists(words[j+1]),
                word_pair_array: [words[j], this.checkExists(words[j+1])],
                next_word: this.checkExists(words[j+2]),
                prev_word: this.checkExists(words[j-1]),
                //count: 1, // Deprecated: Was originally using this to potentially rank keywords, but this isn't needed now.
              };
              countWords++;
              this.wordpairs.push(curWord);
            }
        }
    }

    // Clean up the results by moving some undesirable ish from our word arrays.
    delete this.startwords['"'];
    delete this.startwords[''];
    delete this.startwords[' '];

    //console.log('STARTWORDS: ', this.startwords);
    //console.log(this.wordpairs);
    console.log('TOTAL WORDS: ', countWords);
    console.log('DICTIONARY: ', this.dictionary);
    return this.wordpairs;
  },

  // Checks if the next word exists and adds it to the corpus dictionary.
  // TODO: We're probably returning unnecessary space if a word doesn't exist. Need to fix.
  checkExists: function(value) {
    if (!value) {
      //return '';
    } else {
      return value;
    }
  },

  checkSentenceEnd: function(word) {

    // Sometimes, an undefined value is passed in here and we need to properly handle it.
    // Let's just return from the function and do nothing.
    if (word === undefined) {
      console.log('checkSentenceEnd, Nothing Found: ', word);
      return false;
    }

    var endMarks = ['.', '!', '?'];
    var endMark = word.slice(-1);
    if (endMarks.indexOf(endMark) != -1) {
      //console.log('End punctuation found!!')
      return true;
    } else {
      //console.log('End punctuation not found.');
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
    //console.log('SECOND WORD IN choosePairs:', secondWord);
    var allResults = [];
    var resultWordPair;
    var getResult;
    if (secondWord === undefined || secondWord === null) {
      getResult = this.searchObject(this.wordpairs, 'first_word', firstWord);
      resultWordPair = getResult[Math.floor(Math.random() * getResult.length)];
      
      //console.log('GET RESULTS from choosePairs 1: ', getResult);

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

      //console.log('Word_Pairs:');
      //console.log(allResults[0] + ' ' + allResults[1] + '. __Next Word: ' + allResults[2]);
      return allResults;    
    } else if (secondWord === '') {
      //console.log('GET RESULTS from choosePairs 2: ', getResult);

      // This means the second word does not exist. Uh, oh!
      //console.log('--== Second word pair not detected. ==--');
      allResults[0] = '';
      allResults[1] = '';
      allResults[2] = '';
      allResults[3] = 'end'; // Send a flag to our sentence generation function that says no more words are detected, so stop.
      return allResults;
    } else {
      //console.log('GET RESULTS from choosePairs 3: ', getResult);

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
    var keepGoing = true; // Basically, we want to keep generating a sentence until we either run out of words or hit a punctuation mark.
    var startWord = this.choice(this.startwords); // Get initial start word.
    //console.log('Start Word: ' + startWord);
    
    var initialWords = this.choosePairs(startWord); // Choose initial word pair.
    //console.log('INITIAL WORDS: ', initialWords);

    var tweet = [startWord];
    tweet.push(initialWords[1]);
    tweet.push(initialWords[2]);

    //console.log(tweet);

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

    // Remove undesireable elements from the END of our array.
    // TODO: Need to add this in.
    /*
    delete ['a'];
    delete ['the'];
    delete ['and'];
    delete ['is'];
    delete ['w/'];    
    */    

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
      //console.log('Error: Zero length sentence detected.');
      wholeTweet = make_tweet(min_length);
    }

    return wholeTweet;
  },

  // I'll be honest. I kind of forget what this function does.
  searchObject: function (array, prop, value) {
    //console.log('SEARCH OBJECT??', array, prop, value);
    var result = array.filter(function (obj) {
      return obj[prop] === value;
    });

    //console.log('SEARCH OBJECT VALUE:', value);
    //console.log('SEARCH OBJECT RESULTS:', result);
    return result;
  }

};