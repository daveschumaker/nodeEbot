/** 
 *  Actions for watching and posting to Twitter
 *  
 */

var Promise = require('bluebird');
var Twitter = require('twitter');
var config = require('../../config');
var generator = require('../generator');
var utils = require('../utilities');


// Initialize a new Twitter client using the provided API keys.
var client = new Twitter({
  consumer_key: config.twitter.consumer_key,
  consumer_secret: config.twitter.consumer_secret,
  access_token_key: config.twitter.access_token_key,
  access_token_secret: config.twitter.access_token_secret
});

// On initial load, store robot's interests as an object for faster lookup.
var interestsObject = {};

module.exports = {
  // Map robot's interests array to an object for constant time lookup.
  mapInterests: function() {
    config.personality.robotInterests.forEach(function(element) {
      interestsObject[element] = true;
    });
  },

  // Initialize our Twitter stream and start monitoring 
  // new tweets that appear in our as they come in.
  watchStream: function (mode) {
    // Set proper context for 'this' since it will be called inside some functions.
    var self = this;

    // Each time we call the watchStream method (usually on bootup), map
    // robot interests array from config component into a local object.
    this.mapInterests();

    if (config.settings.monitorStream) {
      client.stream('user', function(stream){
        console.log('Listening to stream...\n\n');

        // Start streaming data from Twitter.
        stream.on('data', function(tweet) {
          // Update time of last tweet that we received so we can check if we've dropped the streaming connection.
          config.settings.lastTweetReceivedTime = Math.floor(Date.now() / 1000);

          // This handles actions that involve a tweet being deleted. If so, we don't want to call the stuff below.
          if (tweet.delete || tweet.friends) {
            //console.log('Detected deletion request from Twitter API...');
          } else {
            // Look at contents of the tweet and determine if we should favorite it.
            if (config.settings.canFavoriteTweets) {
              self.checkInterests(tweet); // Potentially favorite tweet based on interests of our robot.
            }
            
            // Look at Tweet and determine if it's a reply to our robot.
            if (tweet.id !== null) {
              self.checkReply(tweet);
            }            
            //console.log(tweet);
          }
        });

        // Check if we want to destroy the stream
        // I don't think this is really working at the moment.
        if (mode === 'destroy') {
          config.settings.monitorStream = false;
          //stream.destroy();
          //return;
        }

        stream.on('error', function(error) {
          console.log('Error detected with streaming API.');
          console.log(error);
        });
      });
    } else if (!config.settings.monitorStream) {
      console.log('\nWarning: Monitoring Twitter stream is currently disabled \ndue to configuration setting.');
    } else {
      console.log('\nWarning: Something happened while trying watch the Twitter Stream and I\'m not sure what it is.');
    }
  },

  // Count the number of times we've recently replied to a user.
  countReplies: function(user) {
    var countReplies = config.settings.trackReplies.reduce(function(n, val) {
        return n + (val === user);
    }, 0);

    //console.log(trackReplies);

    if (countReplies >= 5) {
      console.log("Warning: Replies to @" + user + " are Temporarily paused so we don't spam them.");
    }

    return countReplies;
  },

  // Check if a new tweet in our stream is a reply to us.
  checkReply: function(tweet) {
    var checkTweet = tweet.text.toLowerCase();
    var myUsername = '@' + config.settings.robotName.toLowerCase();
    //var randomReply = false; // Initial condition that makes bot decide whether or not to reply to someone in its feed.

    var replyID = tweet.id_str; // Get the ID of the tweet so we can properly reply to it.
    var replyUsername = tweet.user.screen_name;
    var replyCount = 0;

    // Randomly reply to tweets that pop up in our stream.
    var x = Math.random(); // Generate random number to determine whether we will reply or not
    if (config.settings.randomReplies && x <= config.settings.randomRepliesChance && checkTweet.indexOf(myUsername) == -1 && (typeof tweet.retweeted_status === "undefined")) {

      //replyCount = this.countReplies(replyUsername); // Get the number of times we've recently replied to this user.

      // Prevent robot from going into a reply loop with itself and imploding the universe!
      if (replyUsername.toLowerCase() !== config.settings.robotName.toLowerCase() && replyCount < 5) {
        config.settings.trackReplies.push(replyUsername); // Add user to our reply tracker so we don't spam them too much. 
        console.log('\nRandomly replying to the following tweet from @' + replyUsername + ':');
        console.log(tweet.text);
        

        this.writeReply(replyUsername, replyID, tweet.text);
      }
    }

    // Check if the tweet is a retweet so we don't gum up our replies with crazy username garbage.
    if (typeof tweet.retweeted_status !== "undefined") {
      //console.log("\n\n\n!!!!!!!!!!!!  ALERT: RETWEET!!!!!\n\n\n");
    }

    // Build a standard reply to a user who mentions us.
    if (checkTweet.indexOf(myUsername) != -1 && (typeof tweet.retweeted_status == "undefined")) {
      var tempUserArray = []; // Keep track of all the users mentioned in this tweet.
      var tempAdditionalUsers; // We'll use this to generate a string of additional users.
      
      // Checks tweet for any additional mentions and adds them to a temporary array.
      var checkMentions = tweet.text.split(' ');
      for (var i = 0; i < checkMentions.length; i++) {
            if (checkMentions[i].substring(0, 1) == "@") {
              // Make sure we aren't adding our own robot to the array
              if (checkMentions[i].toLowerCase() != '@' + config.settings.robotName.toLowerCase()) {
                checkMentions[i] = checkMentions[i].replace(/[\W]*$/g,''); // Remove any cruft at end of username like question marks.
                //console.log('Found additional user mentioned: ' + checkMentions[i]);
                tempUserArray.push(checkMentions[i]);
              }
            }      
      }

      // See if we have any additional users that we'll pass to our reply function below.
      var replyUsers;
      if (tempUserArray.length > 0) {
        tempAdditionalUsers = tempUserArray.join(' ');
        replyUsers = replyUsername + ' ' + tempAdditionalUsers;
      } else {
        replyUsers = replyUsername;
      }

      //replyCount = this.countReplies(replyUsername); // Get the number of times we've recently replied to this user.

      // Prevent robot from going into a reply loop with itself!
      if (replyUsername.toLowerCase() !== config.settings.robotName.toLowerCase() && replyCount < 5) {
        // Quick and dirty way to add any bots to our temporary replies blacklist.
        if (config.personality.otherBots.indexOf(replyUsername.toLowerCase()) != -1) {
          console.log('User \'' + replyUsername +'\' is in our bot list. Temporarily limiting replies to this user.');
          //config.settings.trackReplies.push(replyUsername,replyUsername,replyUsername,replyUsername,replyUsername,replyUsername);
        }

        //config.settings.trackReplies.push(replyUsername); // Add user to our reply tracker so we don't spam them too much.    
        console.log('\nNew reply from @' + replyUsername + ':');
        console.log(tweet.text);
        
        this.writeReply(replyUsers, replyID, tweet.text);
      }
    }
  },

  // Check tweet when it comes it to see if it matches any of our interests.
  // If so, the robot will favorite the tweet.
  // TODO: Let the robot choose between retweeting or favoriting (or both!)
  // TODO: Make sure robot can only favorite a particular tweet once. Might need some sort
  // of object or array to properly handle this.
  checkInterests: function (tweet) {
    if (tweet.id !== null) {
      var tweetID;
      var tweetUsername;
      var tweetText;

      tweetID = tweet.id_str;
      tweetUsername = tweet.user.screen_name;
      tweetText = tweet.text.toLowerCase();

      // Check if this particular tweet is a retweet.
      // If so, we need to slightly change how data is stored.
      if (tweet.retweeted_status) {
        //console.log('Favoriting retweet...');
        tweetID = tweet.retweeted_status.id_str;
        tweetUsername = tweet.retweeted_status.user.screen_name;
        tweetText = tweet.retweeted_status.text.toLowerCase();
      }

      // Check if the tweet coming through is from our own robot.
      // If so, abort everything below, because we don't care anymore.
      if (config.settings.robotName.toLowerCase() === tweetUsername.toLowerCase()) {
        //console.log('Ignoring our own tweet.');
        return;
      }
     
      // Base condition for our robot. Change to true if we've found
      // a matching interest. This will prevent us from trying to
      // favorite a tweet multiple times.
      var foundInterest = false;
      var tempInterest; // Store the interest we found within the tweet.

      // Split up the text of the tweet into an array.
      var tweetTextArray = tweetText.split(' ');

      // Callback function to check if a particular element is a robot interest.
      var isRobotInterest = function(element) {
        if (interestsObject[element]) {
          tempInterest = element;
          foundInterest = true;
        }
        
        return interestsObject[element];
      };

      // Iterate over the tweetTextArray and see if there's a matching interest
      // from the robotInterests object.
      tweetTextArray.some(isRobotInterest);

      if (foundInterest) {
        var tweetType = 'tweet';
        if (tweet.retweeted_status) tweetType = 'retweet';
        console.log('\n', utils.currentTime(), 'Favoriting the following ' + tweetType + ' from @' + tweetUsername + ' because it mentions \'' + tempInterest + '\':');
        console.log('\n',tweet.text);

        client.post('favorites/create', {id: tweetID},  function(error, tweet, response){
          if(error) {
            if (error[0].code === 139) {
              // This means we've already favorited this tweet. Ignore it.
            } else {
              console.log('Error favoriting tweet. Possible API rate limit encountered. Please wait a few moments.');
              console.log(error);
            }
          }
        });
      }
    }
  },

  // Check if the user is in our ignore list. If so, we're not going to write a reply.
  checkIgnored: function(username) {
    if (config.settings.ignoredUsers.indexOf(username.toLowerCase()) != -1) {
      return true;
    } else {
      return false;
    }
  },


  // Check if the Twitter stream is active. It sometimes has a nasty habit of dying.
  // Sometimes, Twitter can drop our stream. Based on this document, 
  // we check out lastTweetTime stamp to see if
  // it's been longer than 90 seconds since the last Tweet. 
  // If so, restart the stream!
  // More info: https://dev.twitter.com/streaming/overview/connecting
  checkStream: function() {
    var curTime = Math.floor(Date.now() / 1000);   
    // It's been longer than around 120 seconds since we've seen a tweet. Let's restart the stream.
    // console.log('[' + utils.currentTime() + '] Debug - lastTweetReceivedTime: ', config.settings.lastTweetReceivedTime);
    if (curTime - config.settings.lastTweetReceivedTime >= 120) {
      console.log('Stream may have dropped. Restarting stream...');
      this.watchStream();  
    }
  },

  // Send a tweet!
  postNewTweet: function(send_msg) {
    if (config.settings.postTweets) {
      client.post('statuses/update', {status: send_msg},  function(error, tweet, response){
        if(error) {
          console.log('Error posting tweet. Possible API rate limit encountered. Please wait a few moments');
          console.log(error);
        }
      });
    }
  },

  // If we're writing a reply to a tweet, let's pass in the username and the ID of the tweet.
  writeReply: function(username, replyID, replytext) {
    
    if (this.checkIgnored(username)) {
      console.log("\nUser is on ignore list. Not replying.");
    } else {

      // Wrapping everything in a timeout function so that we don't reply instantaneously
      var randomDelay = Math.floor((Math.random() * 5) + 1); // Random delay between 1 and 15 seconds
      var self = this;
      setTimeout(function () {
        var replyTweet;

      // We're going to try to reply to the user with self.
      var myReply = generator.makeSentenceFromKeyword(replytext);

      if (typeof myReply !== 'undefined') {
        console.log('\nGenerating a contextual reply to user.');
        replyTweet = '@' + username + ' ' + myReply;
      } else {
        console.log('\nGenerating a random reply to user.');
        replyTweet = generator.twitterFriendly(true, username); 
      }
        
        console.log('\nReplying to user @' + username + ':');
        console.log(replyTweet);
        if (config.settings.respondReplies) self.sendReply(replyTweet,replyID); 
      }, (randomDelay * 1000));
    }
  },

  // Send a reply.
  // TODO: Merge this with the send a tweet function above.
  sendReply: function(send_msg, replyID) {
    client.post('statuses/update', {status: send_msg, in_reply_to_status_id: replyID},  function(error, tweet, response){
      if(error) {
        console.log('Error posting reply. Possible API rate limit encountered. Please wait a few moments');
        //console.log(error);
      }
    });
  },

  // Check for any new followers
  // If new follower is found, let's be friendly and follow them back!
  getFollowers: function() {
    if (!config.settings.followUsers) {
      console.log("\nWarning: Cannot get users list \n\'follow new users\' is disabled in configuration.");
      return;
    }

    client.get('followers/list', {count: 3}, function(error, followers, response){
      if(error) {
        console.log('followers list error', error);
      }      

      if(!error) {
        var followerArray = [];
        var newFollower = followers.users[0].screen_name;

        client.post('friendships/create', {screen_name: newFollower},  function(error, tweet, response){
          if (error) console.log('create friendships error', error);
          if (!error) {
            if (!tweet.following) { // Check response to see whether or not we were already following user. If not, hey! Awesome!
              console.log('Following user @' + newFollower);
              //console.log(tweet);
            }
          }
        });
      }
    });  
  },

};

/////////
// Object to simulate a fake tweet object so we can check replies and favorites.
// var fakeTweet = {
//   id_str: 12345,
//   text: '@Roboderp This is a random sample tweet to analyze!',
//   user: {
//     screen_name: 'fakeuser',
//   }
// };

//module.exports.checkReply(fakeTweet);
// module.exports.mapInterests();
// module.exports.checkInterests(fakeTweet);

//module.exports.watchStream();