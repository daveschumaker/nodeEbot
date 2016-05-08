/**
*   This robot component handles all the business logic for our robot.
*   Things like event loops, checking for followers, checking tweets, etc.
**/

// Import required npm modules to make our robot work!
var path = require('path');
var fs = require('fs');
var Promise = require('bluebird');
fs = Promise.promisifyAll(fs);

//////////
var Generator = require('../generator'); // Compiles word dictionary and builds new sentences.
var Tweet = require('../tweets'); // Methods to interact with Twitter by writing and favoriting tweets and more.
var utils = require('../utilities'); // Various helper functions


////// Start up tasks //////


var Robot = function Robot(config) {
	this.generator = new Generator(config);
	this.generator = Promise.promisifyAll(this.generator);
	this.tweet = new Tweet(this.generator, config);
	this.config = config;

	// Process a provided list of stop words.
	this.generator.stopwords = fs.readFileAsync(path.join(__dirname, '../../data/stopwords.txt')).toString().split("\n");

	// Filename to source or tweets and other content from?
	tweetFile =  this.config.settings.corpus || path.join(__dirname, '../../tweets.sample.txt');

	// Track times of various actions from our robot
	this.robotActions = {
		lastFollowCheck: 0,
		lastRandomReply: 0,
		lastReply: 0,
		lastRetweet: 0,
		lastTweet: 0
	};
  // Initialize robot and start doing robot things.
  // Example, build word dictionary. Start watching stream, etc.

	// Load up robot settings.
	console.log('\n\nNODEEBOT FOR NODEJS v.0.2.0');
	console.log('by Dave Schumaker (@davely)\n');
	console.log('-== CONFIG SETTINGS ==-');
	console.log(' -Post to Twitter? ' + config.settings.postTweets);
	console.log(' -Repond to DMs? ' + config.settings.respondDMs);
	console.log(' -Repond to replies? ' + config.settings.respondReplies);
	console.log(' -Random replies? ' + config.settings.randomReplies);
	console.log(' -Follow new users? ' + config.settings.followUsers);
	console.log(' -Mark tweets as favorites? ' + config.settings.canFavoriteTweets);
	console.log(' -Tweet interval: ' + config.settings.postInterval + ' seconds');
	console.log('\nAnalyzing data and creating word corpus from file \'' + tweetFile + '\'');
	console.log('(This may take a few minutes to generate...)');

	// Set proper context
	var self = this;

	// Load in text file containing raw Tweet data.
	fs.readFileAsync(tweetFile)
	.then(function(fileContents) {
		//Split content into array, separating by line.
		var content = fileContents.toString().split("\n");
		return content;
	})
	.then(function(content){
		//Build word corpus using content array above.
		return self.generator.buildCorpus(content);
	})
	.then(function(data){
		// Once word dictionary is built, kick off the robots actions!
		self.onBoot();

		console.log('I\m alive and waiting for tasks!');

		/*
		*  There may be a better way to handle this. Right now,
		*  this interval runs every 5 seconds and calls the
		*  robotTasks function, which handles the logic that checks
		*  if it's time to send a new tweet, reload the Twitter stream
		*  etc.
		*/
		setInterval(function() {
			self.robotTasks();
		}, 5000);
	});

}

/*
*  These are tasks the robot should do the first time it loads up.
*/
Robot.prototype.onBoot = function() {
	// Start watching the Twitter stream.
	this.tweet.watchStream();

	// Check for new followers.
	if (this.config.settings.followUsers) {
		this.robotActions.lastFollowCheck = Math.floor(Date.now() / 1000);
		this.tweet.getFollowers();
	}

	// Check if the robot is allowed to tweet on startup.
	// If so, post a tweet!
	if (this.config.settings.tweetOnStartup) {
		this.robotActions.lastTweet = Math.floor(Date.now() / 1000); // Update time of the last tweet.
		newTweet = this.generator.makeTweet(140); // Create a new tweet.
		this.tweet.postNewTweet(newTweet); // Post tweet.
		console.log(utils.currentTime(), newTweet + '');
	}
}

Robot.prototype.robotTasks = function() {
	/*
	*  Check how long it's been since robot last tweeted.
	*  If amount of time is greater than the tweet interval
	*  defined in the config file. Go ahead and post a new tweet.
	*/
	if (Math.floor(Date.now() / 1000) - this.robotActions.lastTweet >= this.config.settings.postInterval) {
		this.robotActions.lastTweet = Math.floor(Date.now() / 1000); // Update time of the last tweet.
		newTweet = this.generator.makeTweet(140); // Create a new tweet.
		this.tweet.postNewTweet(newTweet); // Post tweet.
		console.log(utils.currentTime(), newTweet + '');
	}

	/*
	*  Check if the Twitter Stream dropped. If so, reinitialize it.
	*/
	this.tweet.checkStream();

	/*
	*   Check for new followers
	*/
	if (this.config.settings.followUsers && Math.floor(Date.now() / 1000) - this.robotActions.lastFollowCheck >= 300) {
		this.robotActions.lastFollowCheck = Math.floor(Date.now() / 1000);
		this.tweet.getFollowers();
	}
}

module.exports = Robot;


///// DEBUG STUFF
// var fakeTweet = {
//   id_str: 12345,
//   text: '@Roboderp This is a Dodgers sample tweet to analyze!',
//   user: {
//     screen_name: 'fakeuser',
//   }
// };
