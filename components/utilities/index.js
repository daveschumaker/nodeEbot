/** 
 *  Utilities and Helper Functions
 *  
 */

var config = require('../../config');
var tweet = require('../tweets');

module.exports = {

  // Useful for outputting timestamps to the console for actions from our robot.
  currentTime: function() {
    // Create a new Javascript Date object based on the timestamp
    // Based on following solution: http://stackoverflow.com/questions/847185/convert-a-unix-timestamp-to-time-in-javascript
    var date = new Date(Date.now());
    
    // hours part from the timestamp
    var hours = date.getHours();
    
    // minutes part from the timestamp
    var minutes = "0" + date.getMinutes();
    
    // seconds part from the timestamp
    var seconds = "0" + date.getSeconds();

    var year = date.getFullYear();
    var month = "0" + (date.getMonth() + 1);
    var day = "0" + date.getDate();

    //2015-09-30 00:00:00
    var formattedTime = year + '-' + month.substr(-2) + '-' + day.substr(-2) + ' ' + hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);

    return formattedTime;
  },

  // Check if the Twitter stream is active. It sometimes has a nasty habit of dying.
  // Sometimes, Twitter can drop our stream. Based on this document, 
  // we check out lastTweetTime stamp to see if
  // it's been longer than 90 seconds since the last Tweet. 
  // If so, restart the stream!
  // More info: https://dev.twitter.com/streaming/overview/connecting
  checkStream: function() {
    var curTime = Math.floor(Date.now() / 1000);   
    // It's been longer than around 90 seconds since we've seen a tweet. Let's restart the stream.
    if (Math.floor(Date.now() / 1000) - config.settings.lastTweetReceivedTime >= 90) {
      console.log('Stream may have dropped. Restarting stream...');
      tweet.watchStream();  
    }
  },
};