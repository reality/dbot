/** 
 * Module Name: RSS
 * Description: Allows to read RSS feeds
 */
var FeedParser = require('feedparser')
, request = require('request');

var rss = function(dbot) {
    this.pollInterval = 120000;
    var self = this;
    this.internalAPI = {
        'makeRequest': function(id,feed) {
            var fid = id;
            var req = request(feed.url);
            var feedparser = new FeedParser();
            //dbot.say(feed.server,feed.channel,"Sending request for feed "+fid+" name "+feed.name+" lP:"+feed.lastPosted);
            req.on('error', function (error) {
                    dbot.say(feed.server,feed.channel,"RSS: Request for RSS feed got an error: "+error+" Start self-destruct sequence.");
            });
            req.on('response', function (res) {
                var stream = this;

                if (res.statusCode != 200){
                    dbot.say(feed.server,feed.channel,"RSS: RSS server returned status code "+res.statusCode+". Bastard.");
                    return;
                }

                stream.pipe(feedparser);
            });

            feedparser.on('error', function(error) {
                dbot.say(feed.server,feed.channel,"RSS: Feedparser encountered an error: "+error+";;; Inform administrator!");
            });
            feedparser.on('readable', function() {
                // This is where the action is!
                var stream = this
                 , meta = this.meta // **NOTE** the "meta" is always available in the context of the feedparser instance
                 , item;

                while (item = stream.read()) {
                    if(item.pubdate.getTime() - feed.lastPosted > 0) {
                        var rss = item;
                        feed.lastPosted = item.pubdate.getTime();
                        dbot.db.feeds[fid].lastPosted = feed.lastPosted;
                        var options = {
                            uri: 'https://www.googleapis.com/urlshortener/v1/url',
                            method: 'POST',
                            json: {
                                "longUrl": rss.link
                            }
                        };

                        request(options, function (error, response, body) {
                            if (!error && response.statusCode == 200) {
                                dbot.say(feed.server,feed.channel,"["+feed.name+"] ["+rss.title+"] [Post by "+rss.author+" in "+rss.categories[0]+"] - "+body.id);
                            } else {
                                dbot.say(feed.server,feed.channel,"RSS: Request to shorten URL returned: "+body.id);
                            }
                        });
                    }
                }
            });
        }.bind(this),
        'checkFeeds': function() {
            console.log("Checking feeds...");
            for(var i=0;i<dbot.db.feeds.length;++i) {
                this.internalAPI.makeRequest(i,dbot.db.feeds[i]);
            }
        }.bind(this),
        'reloadFeeds': function() {
            return setInterval(this.internalAPI.checkFeeds,self.pollInterval);
        }.bind(this)
    };
    this.commands = {
        '~addrssfeed': function(event) {
            if(event.params.length < 3) {
                event.reply("GIMME TWO PARAMETERS DUDE");
                return;
            }
            var now = Date.now();
            dbot.db.feeds.push({server:event.server, channel:event.channel.name, name:event.params[1], url:event.params[2], lastPosted: now});
            event.reply("Adding RSS feed named "+event.params[1]+" with URL "+event.params[2]);
        },
        '~rsstest': function(event) {
            event.reply("I posted RSS last @ "+self.lastPosted);
            event.reply("Nothing to test. Go home.");
        },
        '~delrssfeed': function(event) {
            for(var i=0;i<dbot.db.feeds.length;++i) {
                if(dbot.db.feeds[i].server == event.server && dbot.db.feeds[i].channel == event.channel.name && dbot.db.feeds[i].name == event.params[1]) {
                    event.reply("Found feed "+event.params[1]+" you were looking for...");
                    dbot.db.feeds.splice(i,1);
                    event.reply("... removed!");
                    break;
                }
            }
        }
    };
    this.onLoad = function() {
        this.interval = this.internalAPI.reloadFeeds();
    };
    this.onDestroy = function() {
        clearInterval(this.interval);
    };
};

exports.fetch = function(dbot) {
    return new rss(dbot);
};
