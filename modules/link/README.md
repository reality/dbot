## Link

Retrieves page titles.

### Description

This module stores the last posted link in each channel, and provides a command
for retrieving the title of a given link or the last posted link in the channel.

### Configuration

#### autoTitle: false
If this is set to true, the bot will automatically post the titles of links as
they are posted in the channel.

### Commands

#### ~title [link]
If called with a link, the bot will attempt to find and return the title of that
page. If called without a link, the bot will attempt the same on the last link
which was posted in the current channel.
#### ~ud [headword]
Returns the first [Urban Dictionary](http://www.urbandictionary.com) definition for the headword provided.
#### ~xkcd {comic ID}
Returns a link to the [xkcd](http://xkcd.com) comic specified, or the latest one if a comic is not given.
