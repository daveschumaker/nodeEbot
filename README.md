# NodeEbot
## v2.0.0 WORK IN PROGRESS...
_Current Version: 0.1.1_

This is NodeEBot (pronounced as _"nodey bot"_ or even _"naughty bot"_, if you prefer). It stands for **Node** **E**-books **Bot**.


It's a Nodejs package for creating Twitter bots which can write their own tweets and interact with other users (by favoriting, replying, and following). This project draws heavy inspiration from the [twitter_ebooks](https://github.com/mispy/twitter_ebooks) gem for Ruby.

You can see two examples of this bot in action at [@daveleeeeee](https://twitter.com/daveleeeeee) and [@roboderp](https://twitter.com/roboderp).

## Quick Setup

You can run this app and start generating sentences without needing to have Twitter API credentials. Rename tweets.sample.txt to tweets.txt and start adding your own source material to this file. For best results, use one file per line.

Run the application like so...

```
node bot.js
```


## Installation and Usage

This project requires Nodejs v0.10.35+. If you're looking for a place to host Nodejs projects, I've had success setting up a free Ubuntu virtual server through Amazon's Web Services dashboard and installing nodejs on it.

To run, copy the project into your preferred directory and then install the required dependencies using:

```
npm install
```

You can edit various configuration settings in the bot.js file. Before you can begin you'll need to have Twitter API credentials which can be setup [right here](https://apps.twitter.com/). Once you have your consumer API key and secret as well as your access token and secret, add them to the top of the bot.js file:

```
// Twitter API configuration
var client = new Twitter({
  consumer_key: 'xxxx',
  consumer_secret: 'xxxx',
  access_token_key: 'xxxx',
  access_token_secret: 'xxxx'
});
```

You'll also need to add the Twitter username of your bot (without the @ symbol) to the config file. (This is for tracking mentions as well as making sure the bot ignores actions from itself so it doesn't get caught in a loop).

```
// Your robot's Twitter username (without the @ symbol)
// We use this to search for mentions of the robot and to prevent it from replying to itself
robotName = "xxxx";
```

Once that's done, the bot is **almost** ready to go. You can modify a few other settings that influence how chatty the bot is, how often it will interact with other users or use random hashtags and emojis.

## Source material

The one last thing that you'll need to do is give it some source material to generate text from. I use source material my own Twitter archive.

Right now, I haven't implemented a way to parse the Twitter's csv data that's generated when you request your history. In the meantime, I've simply opened up the tweets.csv in a spreadsheet app, copied the contents of the 'text' column into a new file and used that as the source material. This script will treat each line as a separate and unique sentence.

I've added some basic ability to strip our Twitter usernames and URLs from the archive. That means it will treat something like:

```
@davely That's great. I've seen something like that before. 
http://flickr.com/...
```

as

```
That's great. I've seen something like that before.
```

## Running multiple bots

If you want to run multiple bots for different Twitter accounts, copy this project into separate folders (e.g., _~/MyBot1_, _~/MyBot2_, _~/MyBot3_, etc) and make sure you input the proper Twitter API credentials at the top of each bot.js file. Then spool up separate node instances and load up the relevant bot files. 

## Future things to do.

* Better modularization of our script. Right now it's in one ginormous .js file.
* Turn it into a proper npm module. 
* Better regex handling to clean up source material (e.g., links, usernames, etc
* Send direct messages back to users who DM our robot.
* Keyword ranking of our source material. (Sort of implemented but disabled right now since performance is SLOW.)
* Allow robot to reply with some content (e.g., if someone asks what it thinks about 'baseball,' it tries to compose a reply that mentions 'baseball.'
* Retweet various tweets that it finds interesting based on keywords and interests.
* Let it potentially upload images or GIFs.

## Other stuff

If you end up using this script in your own Twitter bots, [let me know](http://twitter.com/davely)! I'd love to know how it works out for you and please let me know about any improvements or suggestions you might have.

Thanks for checking it out!

-[@davely](http://twitter.com/davely)