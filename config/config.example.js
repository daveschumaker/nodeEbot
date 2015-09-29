/** 
 *  CONFIG.JS
 *  
 *  Enter your Twitter API credential here.
 *  You can get Twitter credentials here:
 *  https://dev.twitter.com/
 */

module.exports = {
  /** 
   * Twitter API Keys
   * You can get Twitter credentials here:
   * https://dev.twitter.com/
   */
  twitter: {
    consumer_key: '',
    consumer_secret: '',
    access_token_key: '',
    access_token_secret: ''  
  },

  /** 
   * General Robot Settings
   */
  settings: {
    // Your robot's Twitter username (without the @ symbol)
    // We use this to search for mentions of the robot 
    // and to prevent it from replying to itself
    robotName: "MyTwitterRobot",

    // Interval for new tweets in seconds. Most users will 
    // probably want to tweet once every hour or so, 
    // that way the bot isn't too spammy. (1 hour = 3600 seconds);
    // Note: Since Javascript timers are in milliseconds, 
    // we'll multiply by 1,000 in another function.    
    postInterval: 300,

    // Tweet on startup? This will compose a tweet the moment 
    // the bot is first run, rather than wait for the full interval.
    tweetOnStartup: true,

    // Recorded time of the last tweet the robot received in the stream,
    // so we can check things and restart the stream, if needed. This will
    // be stored as a Unix Timestamp.
    lastTweetReceivedTime: 0,

    // If true, allows the bot to monitor the live Twitter stream
    // (and enables everything below).
    // Default: true
    watchStream: true; 
    
    // If true, respond to DMs. False prevents it from responding to DMs.
    // TODO: Fix this.
    respondDMs: false, 

    // If true, have the bot randomly reply to tweets that 
    // appear in its stream.
    // Default: false
    randomReplies: false, 
    
    // If true, we can repspond to replies!
    respondReplies: true,
    
    // If true, let the robot post to Twitter. 
    // False prevents it from outputting to Twitter.
    postTweets: false, 
    
     // If true, allow the bot to favorite tweets
     // based on the robot's personality settings (see below).
    getFavs: true,
    
    // If true, allow bot to follow new users that have followed it.
    followUsers: true,   
  },

  // Configure your robot's interests!
  personality: {
    // A list of things the robot will be interested in and want 
    // to favorite (and potentially respond to).
    // These are case insensitive.
    robotInterests: ['cyborgs','bot','bots','robot','robots','wall-e'],

    // These are friends' bots and others that we want to interact with 
    // but prevent a reply chain loop. Add usernames here without the @ symbol. 
    // These are case insensitive.
    otherBots:['roboderp'],

    // Hashtags to ignore so our bot doesn't inadvertantly get drawn into 
    // controversial, sensitive, or tragic topics we may have tweeted about in the past.
    // These are case insensitive
    ignoredHashtags: ['#RobotsAreEvil'],

    /* Percent chance that the bot will add additional emojis
    ** to the end of a tweet. e.g., .3 = 30%. 
    */
    addEmojis: 0.2,

    /* Percent chance that the bot will add additional hashtags
    ** to the end of a tweet. e.g., .2 = 20%. 
    */
    addHashtags: 0.1,

    /* Check whether or not our bot is allowed to randomly reply to other
    ** users on its own. 
    ** Default: false
    */
    randomReplies: false,

    /* Percent chance that the bot will randomly reply
    *  to tweets that pop up in its stream. e.g., .05 = 5%
    *  You'll probably want to keep random replies at 0.
    */
    randomRepliesChance: 0.05,

  }

};