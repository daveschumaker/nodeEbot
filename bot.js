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
var robot = require('./components/robot');

// Fire up the robot!
robot.init();
