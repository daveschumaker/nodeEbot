/**
* nodeEbot: A twitter_ebooks style bot for nodejs
* by Dave Schumaker
*
* Heavily inspired by the twitter_ebooks project for Ruby by Mispy
* https://github.com/mispy/twitter_ebooks
*/

var util = require('util');
var fs = require('fs');
var Twitter = require('twitter');

// Twitter API configuration
var client = new Twitter({
  consumer_key: 'xxxx',
  consumer_secret: 'xxxx',
  access_token_key: 'xxxx',
  access_token_secret: 'xxxx'
});

// Your robot's Twitter username (without the @ symbol)
// We use this to search for mentions of the robot and to prevent it from replying to itself
robotName = "username";

// Filename to source our tweets and other content from?
tweetFile = 'tweets.txt';

// Interval for new tweets in seconds. Most users will probably want to tweet once every
// hour or so, that way the bot isn't too spammy. (1 hour = 3600 seconds);
// Note: Since Javascript timers are in milliseconds, we'll multiply by 1,000 farther below.
twitterInterval = 3600;

// A list of things the robot will be interested in and want to favorite (and potentially respond to).
// These are case insensitive
var robotInterests = ['bots','cyborgs','cylons','robot','singularity','skynet'];

// Users to ignore and not interact with. Add usernames here with the @ symbol.
// These are case insensitive (we convert to all lower case farther down in the app)
var ignoredUsers = ['C3PO'];

// These are friends' bots and others that we want to interact with but prevent a reply chain loop
// Add usernames here with the @ symbol. These are case insensitive.
var otherBots = ['Johnny5','r2d2','wallE'];

// Hashtags to ignore so our bot doesn't inadvertantly get drawn into controversial or tragic
// topics we may have tweeted about in the past.
// These are case insensitive (we convert to all lower case farther down in the app)
var ignoredHashtags = ['#blessed'];

// Quick / easy way to set all default values for the robot to true or false for dev purposes.
var easyBot = true;

// Modify robot behavior (replies, favorites, tweeting and DMs): true, false, or easyBot (set above)
var respondDMs = easyBot; // If true, respond to DMs. False prevents it from responding to DMs.
var respondReplies = easyBot; // If true, we can repspond to replies!
var postTweets = easyBot; // If true, let this post to Twitter. False prevents it from outputting to Twitter.
var getFavs = easyBot; // If true, allow the bot to favorite tweets based on our interests up above.
var followUsers = easyBot; // If true, allow bot to follow new users.

// Tweet on starup? This will compose a tweet the moment the bot is first run, rather
// than wait for the full interval above.
var tweetOnStartup = easyBot;

/**
* Initial support for whether or not to enable to the popular keyword list, 
* which can sometimes take awhile to generate.
*
* TODO: Finish this... 
*/
var rankKeywords = false;

/**
* Additional configuration options
*/

/* Percent chance that the bot will add additional emojis
** to the end of a tweet. e.g., .3 = 30%. 
*/
var addEmojis = .2;

/* Percent chance that the bot will add additional hashtags
** to the end of a tweet. e.g., .2 = 20%. 
*/
var addHashtags = .1;

/* Percent chance that the bot will randomly reply
** to tweets that pop up in its stream. e.g., .05 = 5%
*/
var randomReplies = .03;

/**
* !! End configuration settings !!
******************************************************************************************
*/











/***
* -== ROBOT FUNCTIONS AND OTHER ASSORTED MAGIC ==-
*
* For the most part, you probably won't need to edit anything below! 
* Unless you want to change how sentences get generated and that sort of thing.
*
* 
*/

/**
* Initialize our bot and show that we're 
* analyzing our content and getting ready to 
* go online and do all our robotlike things.
*/

// Correct for user entered time and convert from seconds to milliseconds.
// TODO: Write function that lets people input "90 minutes" and automatically parse that to the proper time.
twitterInterval = twitterInterval * 1000;

// Load up robot settings.
console.log('\n\nNODEEBOT FOR NODEJS v.0.1.1');
console.log('by Dave Schumaker (@davely)\n');
console.log('-== CONFIG SETTINGS ==-');
console.log(' -Post to Twitter? ' + postTweets);
console.log(' -Repond to DMs? ' + respondDMs);
console.log(' -Repond to replies? ' + respondReplies);
console.log(' -Follow new users? ' + followUsers);
console.log(' -Mark tweets as favorites? ' + getFavs);
console.log(' -Tweet interval: ' + (twitterInterval / 1000) + ' seconds');
console.log('\nAnalyzing data and creating word corpus from file \'' + tweetFile + '\'');
console.log('(This may take a few minutes to generate...)');
/**
*  Some various things that we want to keep track of.
*/

// Twitter ID of the last reply so we don't we don't reply to anything before that.
// This should probably be deprecated since we're now using the streaming API.
var lastReplyID; 

// Username of the last person we replied to.
var lastReplyUserName;

// Twitter ID of the last DM made to us so we don't reply to any before that.
// TODO: Need to build a way to intialize this when the robot first loads.
var lastDMID; 

/**
** Create an array of replies that we'll wipe out every so often.
** Basically, if we've replied to the same user more than X amount
** of times within a certain time frame, let's not reply to them
** anymore for a bit in order to keep everyone's sanity.
**/
var trackReplies = []; 

// Count the number of times we've recently replied to a user.
function countReplies(user) {
  var countReplies = trackReplies.reduce(function(n, val) {
      return n + (val === user);
  }, 0);

  //console.log(trackReplies);

  if (countReplies >= 5) {
    console.log("Warning: Replies to @" + user + " are Temporarily paused so we don't spam them.");
  }

  return countReplies;
}

/**
* TWITTER API FUNCTIONS! THIS IS WHERE A BUNCH OF MAGIC HAPPENS.
*
*/

// Initialize our Twitter stream and start monitoring tweets as they come in.
var getStream = function () {
client.stream('user', function(stream){
  stream.on('data', function(tweet) {
    // console.log(tweet); // Displays full JSON from Twitter. Useful for debugging.
    if (getFavs) checkInterests(tweet); // Potentially favorite tweet based on interests of our robot.
    if (tweet.id != null) checkReply(tweet);
  });

  stream.on('error', function(error) {
    console.log(error);
  });
});
}

// Check if a new tweet in our stream is a reply to us.
var checkReply = function(tweet) {
  var checkTweet = tweet.text.toLowerCase();
  var myUsername = '@' + robotName.toLowerCase();
  //var randomReply = false; // Initial condition that makes bot decide whether or not to reply to someone in its feed.

  // Randomly reply to tweets that pop up in our stream.
  var x = Math.random(); // Generate random number to determine whether we will reply or not
  if (x <= randomReplies && checkTweet.indexOf(myUsername) == -1) {
    var replyID = tweet.id_str; // Get the ID of the tweet so we can properly reply to it.
    var replyUsername = tweet.user.screen_name;

    var replyCount = countReplies(replyUsername); // Get the number of times we've recently replied to this user.

    // Prevent robot from going into a reply loop with itself and imploding the universe!
    if (replyUsername.toLowerCase() != robotName.toLowerCase() && replyCount < 5) {
      trackReplies.push(replyUsername); // Add user to our reply tracker so we don't spam them too much. 
      console.log('\nRandomly replying to the following tweet from @' + replyUsername + ':');
      console.log(tweet.text);
      writeReply(replyUsername, replyID);
    }
  };

  if (checkTweet.indexOf(myUsername) != -1) {
    var replyID = tweet.id_str; // Store the last reply ID so we don't respond to anything before this.
    var replyUsername = tweet.user.screen_name;
    var tempUserArray = []; // Keep track of all the users mentioned in this tweet.
    var tempAdditionalUsers; // We'll use this to generate a string of additional users.
    
    // Checks tweet for any additional mentions and adds them to a temporary array.
    var checkMentions = tweet.text.split(' ');
    for (var i = 0; i < checkMentions.length; i++) {
          if (checkMentions[i].substring(0, 1) == "@") {
            // Make sure we aren't adding our own robot to the array
            if (checkMentions[i].toLowerCase() != '@' + robotName.toLowerCase()) {
              checkMentions[i] = checkMentions[i].replace(/[\W]*$/g,''); // Remove any cruft at end of username like question marks.
              //console.log('Found additional user mentioned: ' + checkMentions[i]);
              tempUserArray.push(checkMentions[i]);
            }
          }      
    }

    // See if we have any additional users that we'll pass to our reply function below.
    if (tempUserArray.length > 0) {
      tempAdditionalUsers = tempUserArray.join(' ');
      var replyUsers = replyUsername + ' ' + tempAdditionalUsers;
    } else {
      replyUsers = replyUsername;
    }

    var replyCount = countReplies(replyUsername); // Get the number of times we've recently replied to this user.

    // Prevent robot from going into a reply loop with itself!
    if (replyUsername.toLowerCase() != robotName.toLowerCase() && replyCount < 5) {
      // Quick and dirty way to add any bots to our temporary replies blacklist.
      if (otherBots.indexOf(replyUsername.toLowerCase()) != 1) {
        console.log('User is in our bot list. Temporarily limiting replies to this user.')
        trackReplies.push(replyUsername,replyUsername,replyUsername,replyUsername,replyUsername,replyUsername);
      }

      trackReplies.push(replyUsername); // Add user to our reply tracker so we don't spam them too much.    
      console.log('\nNew reply from @' + replyUsername + ':');
      console.log(tweet.text);
      
      writeReply(replyUsers, replyID);
    }
  } else {
    //console.log("That was not a reply");
  }
}

// Check tweet when it comes it to see if it matches any of our interests.
// If so, the robot will favorite the tweet.
// TODO: Let the robot choose between retweeting or favoriting (or both!)
var checkInterests = function(tweet) {
  if (tweet.id != null) {
    var tweetID = tweet.id_str;
    var tweetUsername = tweet.user.screen_name;
    var tweetText = tweet.text.toLowerCase();

    robotInterests.forEach(function (element) {
      var tempInterest = element;
      tempInterest = tempInterest.toLowerCase();

      // If one of our interests is found in the text of the tweet AND our robot wasn't the one who tweeted it, let's favorite it.
      if (tweetText.indexOf(tempInterest) != -1 && tweetUsername.toLowerCase() != robotName.toLowerCase()) {
        console.log('\nFavoriting the following tweet from @' + tweetUsername + ' because it mentions \'' + tempInterest + '\':');
        console.log(tweet.text);

        client.post('favorites/create', {id: tweetID},  function(error, tweet, response){
          if(error) {
            console.log('Error favoriting tweet. Possible API rate limit encountered. Please wait a few moments.');
            //console.log(error);
          }
        });

      } 

    })
  };
};

// Send a tweet!
var sendTweet = function(send_msg) {
  client.post('statuses/update', {status: send_msg},  function(error, tweet, response){
    if(error) {
      console.log('Error posting tweet. Possible API rate limit encountered. Please wait a few moments');
      //console.log(error);
    }
  });
}

// Send a reply.
// TODO: Merge this with the send a tweet function above.
var sendReply = function(send_msg, replyID) {
  client.post('statuses/update', {status: send_msg, in_reply_to_status_id: replyID},  function(error, tweet, response){
    if(error) {
      console.log('Error posting reply. Possible API rate limit encountered. Please wait a few moments');
      //console.log(error);
    }
  });
}

// Send a DM
var sendDM = function (send_msg, toUser) {
  client.post('direct_messages/new', {text: send_msg, screen_name: toUser},  function(error, tweet, response){
    if(error) {
      console.log("Error while sending direct message. Possible API rate limit encountered. Please wait a few moments.");
      //console.log(error);
    }
  });
}

// Check for any new followers
// If new follower is found, let's be friendly and follow them back!
var getFollowers = function() {
  if (!followUsers) {
    console.log("\nWarning: Cannot get users list since \'follow new users\' is disabled in configuration.");
    return;
  }
  client.get('followers/list', {count: 3}, function(error, followers, response){
    if(!error) {
      var followerArray = [];
      var newFollower = followers.users[0].screen_name;

      client.post('friendships/create', {screen_name: newFollower},  function(error, tweet, response){
        if (!error) {
          if (!tweet.following) { // Check response to see whether or not we were already following user. If not, hey! Awesome!
            console.log('Following user @' + newFollower);
            //console.log(tweet);
          }
        }
      });
    }

    //console.log(followers);  // IDs of recent followers.
  });  
}

// Check if the user is in our ignore list. If so, we're not going to write a reply.
var checkIgnored = function(username) {
  //TODO Case insensitive usernames.
  if (ignoredUsers.indexOf(username.toLowerCase()) != -1) {
    return true;
  } else {
    return false;
  }
}

/**
** Here's where we generate all the magical text!
** 
** Initially based on Markov chain generation found here:
** http://www.soliantconsulting.com/blog/2013/02/draft-title-generator-using-markov-chains
**
** However, I've since significantly modified it.
*/

// Convert our ignored hashtags to lower case.
// TODO: Write function that can do this for any array (e.g., usernames)
ignoredHashtags.forEach(function(element, index) {
  ignoredHashtags[index] = element.toLowerCase();
});

// Convert our array of botnames into lower case
otherBots.forEach(function(element, index) {
  otherBots[index] = element.toLowerCase();
});

// Convert our ignored userlist to lower case.
ignoredUsers.forEach(function(element, index) {
  ignoredUsers[index] = element.toLowerCase();
});

// Use this function to clean up our content and remove things that result in poorly generated sentences.
// This probably needs A LOT of improvement. My regex skills suck right now.
var cleanContent = function(content) {
  var cleaned = content;

  cleaned.forEach(function(element, index) {
    
    //console.log(cleaned[index]);
    // Removing all sorts of weird content found in my tweets that screw this whole process up.
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
}

// Load files that contain all relevant tweets, stopwords, etc
var content = fs.readFileSync(tweetFile).toString().split("\n");
var stopwords = fs.readFileSync('./data/stopwords.txt').toString().split("\n");

// Clean up our content
content = cleanContent(content);

//console.log(content);

/*
// Output content
fs.writeFile('tweets_array.txt', JSON.stringify(content), function (err) {
  if (err) return console.log(err);
  console.log('Output > tweets_array.txt');
});
*/

// Keep track of all our word stats
var startwords = []; // Words that start a sentence.
var hashtags = []; // Automatically detect any hashtags that we use.
var wordpairs = []; // This is where we'll store our dictionary of word pairs
var popularKeywords = []; // Track popular keywords that the bot may be interested in based on our tweet history.

/*
*
* USAGE: var getResult = searchObject(wordpairs, 'word_pair', 'addition to');
*/
var searchObject = function (array, prop, value) {
  var result = array.filter(function (obj) {
    return obj[prop] == value;
  });

  return result;
};

/**
*
* var getResult = getWordIndex(wordpairs, 'word_pair', 'addition to');
*/
var getWordIndex = function(array, prop, value) {
  var indexResults = array.map(function(obj, index) {
      if(obj[prop] == value) {
          return index;
      }
  }).filter(isFinite);  

  return indexResults;
}

var checkSentenceEnd = function(word) {
  var endMarks = ['.', '!', '?'];
  var endMark = word.slice(-1);
  if (endMarks.indexOf(endMark) != -1) {
    //console.log('End punctuation found!!')
    return true;
  } else {
    //console.log('End punctuation not found.');
    return false;
  }
}

/*
var indexResults = wordpairs.map(function(obj, index) {
    if(obj.word_pair == "addition to2") {
        return index;
    }
}).filter(isFinite);
*/

// Create an array of popular keywords that the bot can potentially use to reply to or interact with.
// I haven't really done anything with this yet.
var addKeyword = function(word) {
  var checkStopword = word.toLowerCase().replace(/[\W]*$/g,''); // Remove any cruft found at end of word.
  checkStopword = checkStopword.replace(/’/gi,'\''); // Convert blasted smart apostrophes.

  // Before we begin, let's check if the word is a stopword found in
  // our stopwords.txt file. If so, we're going to ignore it.
  if (stopwords.indexOf(checkStopword) == -1 && word != '') {
    var tempIndex; // Store the index location
    word = word.replace(/[\W]*$/g,''); // Remove potential junk at end of word
    word = word.replace(/’/gi,'\''); // Convert blasted smart apostrophes.

    var result = popularKeywords.filter(function( obj ) {
      // Check if this work is already in our keyword array
      if(word == obj.first_word){
        tempIndex = popularKeywords.indexOf(obj);
        //console.log(popularKeywords.indexOf(obj));
      }  

      return obj.first_word == word;
    });

    // Check if the result has been added to our keyword array.
    if (result.length > 0) {
      //console.log('Word found!');
      popularKeywords[tempIndex].count++; // Increment our counter since the word already exists.
    } else {
      //console.log('Word not found, adding: ' + word);
      popularKeywords.push({first_word: word, count: 1});
    }
  }

  //return result;
}

function checkExists(value) {
  if (!value) {
    //console.log('POOP ERROR!!! ' + value);
    return '';
  } else {
    return value;
  }
}

// TODO: Trying to properly build an object containg word pairs for Markov bot.
// Build out our word pair dictionary for creating pseudo Markov chains.
var buildCorpus = function(content) {
  for (var i = 0; i < content.length; i++) {
      var words = content[i].split(' ');
      startwords.push(words[0]);

      for (var j = 0; j < words.length - 1; j++) {
          var checkValid = true; // Flag to check whether a value is true or false.
          if (rankKeywords) { addKeyword(words[j]); } // Start adding popular keywords to our array.

          // Check if word is a hashtag so that we can add it to a special array for later use.
          if (words[j].substring(0, 1) == "#") {
            var tempHashtag = words[j];
            tempHashtag = tempHashtag.replace(/[\W]*$/g,''); // Remove any cruft found at end of hashtag.
            hashtags.push(tempHashtag);
          }

          // Make sure our word isn't an empty value. No one likes that. Not even you.
          if (words[j] != '' && checkValid == true) {
            var curWord = {
              first_word: words[j],
              word_pair: words[j] + ' ' + checkExists(words[j+1]),
              word_pair_array: [words[j], checkExists(words[j+1])],
              next_word: checkExists(words[j+2]),
              prev_word: checkExists(words[j-1]),
              count: 1,
            };
            wordpairs.push(curWord);
          }
      }
  }
  console.log('\nWord pairs analyzed. Corpus ready.');
}

// Call function to start building our word par dictionary
buildCorpus(content);

/**
* KEYWORD CALCULATIONS AND SORTING
* WORK IN PROGRESS
*/

// Sort our keyword list by most popular keywords.
popularKeywords.sort(function(a,b) {
  return b.count - a.count;
})

// Limit the array to the top 200 keywords.
popularKeywords = popularKeywords.slice(0,200);
//console.log(popularKeywords);

// Useful for outputting our results to check if things are working.
//console.log(wordpairs);
//console.log(hashtags);

// Output content to a file. Useful for debugging.
/*
fs.writeFile('word_pairs.txt', JSON.stringify(wordpairs,null,2), function (err) {
  if (err) return console.log(err);
  console.log('Output > word_pairs.txt');
});
*/

// Supply an array and randomly pick a word.
var choice = function (array) {
  var randomWord = array[Math.floor(Math.random() * array.length)];
  //console.log(randomWord);
    return randomWord;
};

// Search for potential word pair matches to start forming out sentences.
var choosePairs = function (firstWord, secondWord) {
  if (secondWord == null) {
    var allResults = [];
    var getResult = searchObject(wordpairs, 'first_word', firstWord);
    var resultWordPair = getResult[Math.floor(Math.random() * getResult.length)];
    
    //Trying to check for a weird undefined error that sometimes happens and crashes app:
    if (typeof(resultWordPair) == "undefined") {
      //console.log('\n--== ERROR: No result returned... ==--\n')
      allResults[0] = '';
      allResults[1] = '';
      allResults[2] = '';
      allResults[3] = 'end';
      return allResults;      
    }

    allResults[0] = checkExists(resultWordPair.word_pair_array[0]);
    allResults[1] = checkExists(resultWordPair.word_pair_array[1]);
    allResults[2] = checkExists(resultWordPair.next_word);

    //console.log('Word_Pairs:');
    //console.log(allResults[0] + ' ' + allResults[1] + '. __Next Word: ' + allResults[2]);
    return allResults;    
  } else if (secondWord == '') {
    // This means the second word does not exist. Uh, oh!
    //console.log('--== Second word pair not detected. ==--');
    var allResults = [];
    allResults[0] = '';
    allResults[1] = '';
    allResults[2] = '';
    allResults[3] = 'end'; // Send a flag to our sentence generation function that says no more words are detected, so stop.
    return allResults;
  } else {
    var allResults = [];
    var getResult = searchObject(wordpairs, 'word_pair', firstWord + ' ' + secondWord); // Change I to whatever
    var resultWordPair = getResult[Math.floor(Math.random() * getResult.length)];

    //Trying to check for a weird undefined error that sometimes happens and crashes app:
    if (typeof(resultWordPair) == "undefined") {
      //console.log('\n--== ERROR: No result returned... ==--\n')
      allResults[0] = '';
      allResults[1] = '';
      allResults[2] = '';
      allResults[3] = 'end';
      return allResults;      
    }

    allResults[0] = checkExists(resultWordPair.word_pair_array[0]);
    allResults[1] = checkExists(resultWordPair.word_pair_array[1]);
    allResults[2] = checkExists(resultWordPair.next_word);

    return allResults;      
  }
}

// Generate a new sentence that is within the limit of 140 characters.
var make_tweet = function (min_length) {
    var keepGoing = true; // Basically, we want to keep generating a sentence until we either run out of words or hit a punctuation mark.
    word = choice(startwords); // Get initial start word.
    //console.log('Start Word: ' + word);
    var initialWords = choosePairs(word); // Choose initial word pair.

    var tweet = [word];
    tweet.push(initialWords[1]);
    tweet.push(initialWords[2]);

    while (keepGoing == true) {  
      var getNewWords = choosePairs(tweet[tweet.length - 2],tweet[tweet.length - 1]);
      //console.log(getNewWords[2]);
      if (getNewWords[3] == 'end') break; // No more words detected. Stop, yo!
      
      tweet.push(getNewWords[2]);
      if (checkSentenceEnd(getNewWords[2]) == true) break; // Check if the end of the word contains a sentence ending element.
    }

    // Remove undesireable elements from our array
    function removeElements(array, value) {
      if (array.indexOf(value) != -1) {
        //console.log('REMOVING: ' + value);
        for(var i = array.length-1; i--;){
          if (array[i] === value) array.splice(i, 1);
        }   
      }  
      return array; 
    }

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
    tweet = tweet.filter(function(e){return e}); 

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
    if (wholeTweet.length == 0) {
      //console.log('Error: Zero length sentence detected.');
      wholeTweet = make_tweet(min_length);
    }

    return wholeTweet;
};

// Clean up the results by moving some undesirable ish from our word arrays.
delete startwords['"'];
delete startwords[''];
delete startwords[' '];

// Random add a hashtag to the end of our tweet.
var attachHashtag = function(tweetlength) {
  var gethashtag;
  var x = Math.random(); // Generate random number to determine whether we add a hashtag or not
  if (x <= addHashtags) {
    // Pick a random emoji from our array
    gethashtag = hashtags[Math.floor(Math.random()*hashtags.length)];
  
  // Check if we should be ignoring this hashtag before we include it.
  if (ignoredHashtags.indexOf(gethashtag.toLowerCase()) != -1) {
    //console.log('Ignoring the following hashtag: ' + gethashtag);
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
}

// Let's randomly include an emoji at the end of the tweet.
var attachEmoji = function(tweetlength) {
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
    " ❤️",
    " 💔",
    //" 🏃💨 💩"
  ];

  var x = Math.random(); // Generate random number to determine whether we show emoji or not
  if (x <= addEmojis) {
    // Pick a random emoji from our array
    emoji = emojis[Math.floor(Math.random()*emojis.length)];
  } else {
    emoji = '';
  }


  if (tweetlength < 130) {
    return emoji;
  }
}

// Make sure our function spits out phrases less than a certain length.
var twitterFriendly = function (reply, username) {
  var new_tweet;
  if (reply) {
    username = '@' + username + ' ';
  } else {
    username = '';
  }

  do {
    var randomLength = Math.floor((Math.random() * 20) + 10); // Random length between 10 and 20 words.
    new_tweet = make_tweet(randomLength);
    new_tweet = username + new_tweet + attachHashtag(new_tweet.length); // Randomly add a hashtag
    new_tweet = new_tweet + attachEmoji(new_tweet.length); // Randomy add an emoji

  } while (new_tweet.length > 140);

  // TODO: This is a stupid, hacky way to fix weird messages that only say "RT" every so often.
  if (new_tweet == "RT") {
    twitterFriendly(reply, username);
  }
  return new_tweet;
}

// If we're writing a reply to a tweet, let's pass in the username and the ID of the tweet.
var writeReply = function(username, replyID) {
  
  if (checkIgnored(username)) {
    console.log("\nUser is on ignore list. Not replying.");
  } else {

    // Wrapping everything in a timeout function so that we don't reply instantaneously
    var randomDelay = Math.floor((Math.random() * 15) + 1); // Random delay between 1 and 15 seconds
    setTimeout(function () {
      var replyTweet;
      replyTweet = twitterFriendly(true, username);
      console.log('\nReplying to user @' + username + ':');
      console.log(replyTweet);
      if (respondReplies) sendReply(replyTweet,replyID); 
    }, (randomDelay * 1000));
  }
}

var newTweet; //

var tweetStatus = "Tweet: "; // Update status on whether this is only a generated tweet ("tweet") or actually being tweeted ("tweeting")
if (postTweets) tweetStatus = "Tweeting: ";

// TODO: On initial load, set ourlastreplyID to last detected reply
// So we don't continuously spam a user when / if our server reboots.
// ourLastReplyToID = lastReplyID;

// Using callback function so we can keep the stream running in the background. Good? Maybe?
var startApp = function(params, callback) {
  // On load:
  console.log('\nRobot is online...');

  if (tweetOnStartup)  {
    newTweet = twitterFriendly(false);
    if (postTweets) sendTweet(newTweet);

    console.log("\n");
    console.log(tweetStatus + newTweet + "\n(" + newTweet.length + " characters)"); // Number of characters in generated sentence.
  }

  getFollowers();
  callback();
}

// Initially start our app.
startApp(null,getStream);

var runApp = function() {

  newTweet = twitterFriendly(false);
  if (postTweets) sendTweet(newTweet);

  console.log("\n");
  console.log(tweetStatus + newTweet + "\n(" + newTweet.length + " characters)"); // Number of characters in generated sentence.

}

/*
* Our interval that will keep our app health and running. Woooo!
* // Based on how often the user wants to tweet things.
*/
setInterval(function() {
  runApp();
}, twitterInterval);

/**
** Longer loop for certain actions like checking for friends, checking new DMs or replying to DMs
** Basically this is for things which aren't supported by Twitter's streaming API.
**
** Currently set to refresh every 3 minutes.
**/

setInterval(function() {
  trackReplies = []; // Clear out our replies array.

  // Check for friends 
  getFollowers();
}, 180000);
