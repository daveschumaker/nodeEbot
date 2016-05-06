/**
* nodeEbot v.0.2.0!
* A twitter_ebooks style bot for Node.js
* by Dave Schumaker (@davely)
* https://github.com/daveschumaker/nodeEbot
*
* Heavily inspired by the following twitter_ebooks project for Ruby by Mispy:
* https://github.com/mispy/twitter_ebooks
*/

/*
*   Import the robot component.
*   This is where all the business logic is handeled.
*/
var _ = require('lodash');
var defaultConfig = require('./config');
var Robot = require('./components/robot');

// Fire up the robot!
module.exports = function(userConfig) {
	config = _.merge(defaultConfig, userConfig);

	return new Robot(config)
}
