/** 
 * Module Name: RSS
 * Description: Allows to read RSS feeds
 */
var FeedParser = require('feedparser')
, request = require('request');

var rss = function(dbot) {
    this.feedparser = new FeedParser();
    this.feeds = [];
    this.internalAPI = {
        'makeRequest': function(server,channel,name,url) {
            dbot.say(server,channel,"Starting request for "+name+" with url "+url);
            var req = request(url);
            req.on('error', function (error) {
                // handle any request errors
            });
            req.on('response', function (res) {
                var stream = this;

                if (res.statusCode != 200) return this.emit('error', new Error('Bad status code'));

                stream.pipe(this.feedparser);
            });

            this.feedparser.on('error', function(error) {
                // always handle errors
            });
            this.feedparser.on('readable', function() {
                // This is where the action is!
                var stream = this
                 , meta = this.meta // **NOTE** the "meta" is always available in the context of the feedparser instance
                 , item;

                while (item = stream.read()) {
                    dbot.say(server,channel,"FEED: "+item.title);
                }
            });
        }.bind(this),
        'reloadFeeds': function() {
            console.log("rss: reloading feeds...");
            // TODO actually reload feeds, set timers to refresh, refresh
        }.bind(this)
    };
    this.commands = {
        '~addrssfeed': function(event) {
            if(event.params.length < 3) {
                event.reply("GIMME TWO PARAMETERS DUDE");
                return;
            }
            dbot.db.feeds.push({server:event.server, channel:event.channel.name, name:event.params[1], url:event.params[2]});
            event.reply("Adding RSS feed named "+event.params[1]+" with URL "+event.params[2]);
        },
        '~getrssfeed': function(event) {
            event.reply("Can't :'(");
        },
        '~test': function(event) {
            this.internalAPI.makeRequest(event.server,event.channel.name,event.params[1],event.params[2]);
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
        /*
        this.feedparser = new FeedParser();
        this.feedparser.on('error', function(error) {
            // always handle errors
        });
        this.feedparser.on('readable', function() {
            // This is where the action is!
            var stream = this
             , meta = this.meta // **NOTE** the "meta" is always available in the context of the feedparser instance
             , item;

            while (item = stream.read()) {
                event.reply("roiroiroi -> "+item.title+" <- -> "+item.link+" <-");
            }
        });
        */
    }
};

exports.fetch = function(dbot) {
    return new rss(dbot);
};
