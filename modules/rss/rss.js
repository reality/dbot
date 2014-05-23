/** 
 * Module Name: RSS
 * Description: Allows to read RSS feeds
 */
var FeedParser = require('feedparser')
, request = require('request');

var rss = function(dbot) {
    var self = this;
    this.intervals = [];
    this.internalAPI = {
        'makeRequest': function(server,channel,name,url) {
            dbot.say(server,channel,"Starting request for "+name+" with url "+url);
            var req = request(url);
            var feedparser = new FeedParser();
            req.on('error', function (error) {
                    dbot.say(server,channel,"Request got an error: "+error);
            });
            req.on('response', function (res) {
                var stream = this;

                if (res.statusCode != 200){
                    dbot.say(server,channel,"Request had status code "+res.statusCode);
                    return;
                }

                stream.pipe(feedparser);
                dbot.say(server,channel,"Request piped to feedparser!");
            });

            feedparser.on('error', function(error) {
                dbot.say(server,channel,"Feedparser got an error: "+error);
            });
            feedparser.on('readable', function() {
                // This is where the action is!
                var stream = this
                 , meta = this.meta // **NOTE** the "meta" is always available in the context of the feedparser instance
                 , item;

                while (item = stream.read()) {
                    dbot.say(server,channel,"@ "+item.pubdate+": ["+name+"] ["+item.title+"] [Post by "+item.author+" in "+item.categories[0]+"] - "+item.link);
                }
            });
        }.bind(this),
        'reloadFeeds': function() {
            console.log("rss: reloading feeds...");
            for(var i=0;i<dbot.db.feeds.length;++i) {
                var server = dbot.db.feeds[i].server, channel = dbot.db.feeds[i].channel, name = dbot.db.feeds[i].name, url = dbot.db.feeds[i].url;
                console.log("Server: "+server+"; Channel: "+channel+" Loading feed "+i+" named "+name);
                this.intervals.push(setInterval(function() {
                    self.internalAPI.makeRequest(server,channel,name,url)
                },30000));
            }
        }.bind(this)
    };
    this.commands = {
        '~addrssfeed': function(event) {
            if(event.params.length < 3) {
                event.reply("GIMME TWO PARAMETERS DUDE");
                return;
            }
            dbot.db.feeds.push({server:event.server, channel:event.channel.name, name:event.params[1], url:event.params[2]});
            this.intervals.push(setInterval(function() {self.internalAPI.makeRequest(event.server,event.channel.name,event.params[1],event.params[2])},30000));
            event.reply("Adding RSS feed named "+event.params[1]+" with URL "+event.params[2]);
        },
        '~rsstest': function(event) {
            event.reply("Nothing to test. Go home.");
        },
        '~delrssfeed': function(event) {
            for(var i=0;i<dbot.db.feeds.length;++i) {
                if(dbot.db.feeds[i].server == event.server && dbot.db.feeds[i].channel == event.channel.name && dbot.db.feeds[i].name == event.params[1]) {
                    event.reply("Found feed "+event.params[1]+" you were looking for...");
                    dbot.db.feeds.splice(i,1);
                    event.reply("... removed!");
                }
            }
        }
    };
    this.onLoad = function() {
        this.internalAPI.reloadFeeds();
    };
    this.onDestroy = function() {
        for(var i=0;i<this.intervals.length;++i) {
            clearInterval(this.intervals[i]);
        }
    };
};

exports.fetch = function(dbot) {
    return new rss(dbot);
};
