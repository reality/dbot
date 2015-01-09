/** 
 * Module Name: reddit
 * Description: Various reddit functionality
 */
var _ = require('underscore')._,
    request = require('request');

var reddit = function(dbot) {
    this.ApiRoot = 'http://reddit.com/';
    this.UserAgent = 'dbot by u/realitone';
    this.ints = [];

    this.internalAPI = {
        'getChannelFeeds': function(server, cName, callback) {
            this.db.read('reddit_feeds', cName + '.' + server, function(err, cFeeds) {
                if(err || !cFeeds) {
                    callback(null, {
                        'id': cName + '.' + server,
                        'server': server,
                        'channel': cName,
                        'feeds': {}
                    });
                } else {
                   callback(null, cFeeds); 
                }
            });
        }.bind(this),

        'updateChannelFeeds': function(cFeeds, callback) {
            this.db.update('reddit_feeds', cFeeds.id, cFeeds, callback);
        }.bind(this),
        
        'reloadChannelFeeds': function() {
            var channels = [],
                checkTimes = [];

            for(i=0;i<this.ints.length;i++) {
                clearInterval(this.ints[i]); 
            }
            this.ints = [];

            this.db.scan('reddit_feeds', function(channel) {
                if(channel) {
                    channels.push(channel); 
                }
            }, function() {
                _.each(channels, function(channel) {
                    checkTimes[channel.id] = {};
                    _.each(channel.feeds, function(feed) {
                        checkTimes[channel.id][feed.subreddit] = Date.now();
                        var intervalId = setInterval(function() {
                            this.api.getNewPosts(feed.subreddit, checkTimes[channel.id][feed.subreddit], function(err, posts) {
                                if(!err && posts.length > 0) {
                                    _.each(posts, function(post) {
                                         dbot.say(channel.server, channel.channel, dbot.t('about_new_post', {
                                            'title': _.unescape(post.title.trim()),
                                            'poster': post.author,
                                            'subreddit': post.subreddit,
                                            'comments': post.num_comments,
                                            'score': post.score,
                                            'up': post.ups,
                                            'down': post.downs,
                                            'url': this.ApiRoot + post.id
                                        }));
                                    }, this);
                                    checkTimes[channel.id][feed.subreddit] = Date.now();
                                }
                            }.bind(this)); 
                        }.bind(this), feed.interval);
                        this.ints.push(intervalId);
                    }.bind(this));
                }.bind(this));
            }.bind(this));
        }.bind(this)
    };

    this.api = {
        'getSubredditInfo': function(name, callback) {
            request.get({
                'url': this.ApiRoot + 'r/' + name + '/about.json',
                'json': true,
                'headers': {
                    'User-Agent': this.UserAgent
                }
            }, function(err, response, body) {
                var data = null;
                if(_.has(body, 'data')) data = body.data;
                callback(data);
            });
        },

        'getPostInfo': function(name, callback) {
            request.get({
                'url': this.ApiRoot + 'comments/' + name + '.json',
                'json': true,
                'headers': {
                    'User-Agent': this.UserAgent
                }
            }, function(err, response, body) {
                if(body[0] && _.has(body[0], 'data')) {
                    callback(body[0].data.children[0].data);
                }
            });
        },

        'getCommentInfo': function(post, name, callback) {
            request.get({
                'url': this.ApiRoot + 'comments/' + post + '.json',
                'qs': {
                    'comment': name
                },
                'json': true,
                'headers': {
                    'User-Agent': this.UserAgent
                }
            }, function(err, response, body) {
                if(body[1] && _.has(body[1], 'data')) {
                    callback(body[1].data.children[0].data);
                }
            });
        },

        'getNewPosts': function(sr, last, callback) {
            request.get({
                'url': this.ApiRoot + 'r/' + sr + '/new.json',
                'json': true,
                'headers': {
                    'User-Agent': this.UserAgent
                }
            }, function(err, response, body) {
                if(!err && body && body.kind === 'Listing') {
                    var posts = _.pluck(body.data.children, 'data');
                        newPosts = _.filter(posts, function(post) {
                            return post.created_utc > (last / 1000);
                        });
                    callback(null, newPosts);
                } else {
                    callback(true, null);
                }
            });
        },

        'getTopPosts': function(sr, callback) {
            request.get({
                'url': this.ApiRoot + 'r/' + sr + '/top.json',
                'json': true,
                'headers': {
                    'User-Agent': this.UserAgent
                }
            }, function(err, response, body) {
                if(!err && body && body.kind === 'Listing') {
                    var posts = _.pluck(body.data.children, 'data');
                    callback(null, posts);
                } else {
                    callback(true, null);
                }
            });
        }
    };

    this.commands = {
        '~question': function(event) {
            this.api.getTopPosts('askreddit', function(err, posts) {
                if(!err) {
                    var qPost = posts[_.random(0, posts.length - 1)]; 
                    event.reply('Question: ' + qPost.title.trim());
                }
            });
        },

        '~squestion': function(event) {
            this.api.getNewPosts('askscience', 0, function(err, posts) {
                if(!err) {
                    var qPost = posts[_.random(0, posts.length - 1)]; 
                    event.reply('Question: ' + qPost.title.trim());
                }
            });
        },

        '~addredditfeed': function(event) {
            var channel = event.input[1],
                subreddit = event.input[2].replace('r/', ''),
                interval = event.input[3] * 60000;

            this.internalAPI.getChannelFeeds(event.server, channel, function(err, channel) {
                if(!err) {
                    if(!_.has(channel.feeds, subreddit)) {
                        channel.feeds[subreddit] = {
                            'subreddit': subreddit,
                            'interval': interval
                        };
                        this.internalAPI.updateChannelFeeds(channel, function() {
                            this.internalAPI.reloadChannelFeeds();
                        }.bind(this));
                        event.reply(dbot.t('added_channel_feed', {
                            'subreddit': subreddit,
                            'interval': interval / 60000,
                            'channel': channel.channel
                        }));
                    } else {
                        event.reply(dbot.t('feed_already_watched'));         
                    }
                } else {
                    if(err === 'NoSuchChannel') {
                        event.reply(dbot.t('no_such_channel'));
                    }
                }
            }.bind(this));
        },

        '~rmredditfeed': function(event) {
            var channel = event.input[1],
                subreddit = event.input[2].replace('r/', '');

            this.internalAPI.getChannelFeeds(event.server, channel, function(err, channel) {
                if(!err && channel && _.has(channel.feeds, subreddit)) {
                    delete channel.feeds[subreddit];
                    this.internalAPI.updateChannelFeeds(channel, function() {
                        this.internalAPI.reloadChannelFeeds();
                    }.bind(this));

                    event.reply(dbot.t('removed_channel_feed', {
                        'subreddit': subreddit,
                        'channel': channel.channel
                    }));
                } else {
                    event.reply(dbot.t('no_such_feed'));
                }
            }.bind(this));
        }
    };
    this.commands['~addredditfeed'].regex = [/^addredditfeed ([^ ]+) ([^ ]+) ([^ ]+)$/, 4];
    this.commands['~rmredditfeed'].regex = [/^rmredditfeed ([^ ]+) ([^ ]+)$/, 3];
    this.commands['~addredditfeed'].access = 'moderator';
    this.commands['~rmredditfeed'].access = 'moderator';

    this.onDestroy = function() {
        for(i=0;i<this.ints.length;i++) {
            clearInterval(this.ints[i]); 
        }
    }.bind(this);

    this.onLoad = function() {
        this.internalAPI.reloadChannelFeeds();

        var rHandler = function(matches, name, callback) {
            if(matches[6]) { // It's a comment
                this.api.getCommentInfo(matches[4], matches[6], function(info) {
                    if(info) {
                        var infoString = dbot.t('about_comment', {
                            'poster': info.author,
                            'subreddit': info.subreddit,
                            'comments': info.num_comments,
                            'score': info.ups - info.downs,
                            'up': info.ups,
                            'down': info.downs
                        });
                        if(info.over_18) infoString += " " + dbot.t("nsfw");
                        callback(infoString);
                    } 
                });
            } else if(matches[4]) { // It's a post
                this.api.getPostInfo(matches[4], function(info) {
                    if(info) {
                        var infoString = dbot.t('about_post', {
                            'title': _.unescape(info.title.trim()),
                            'poster': info.author,
                            'subreddit': info.subreddit,
                            'comments': info.num_comments,
                            'score': info.score,
                            'up': info.ups,
                            'down': info.downs,
                            'url': this.ApiRoot + matches[4]
                        });
                        if(info.over_18) infoString += " " + dbot.t("nsfw");
                        callback(infoString);
                    }
                }.bind(this));
            } else if(matches[2]) { // It's a subreddit
                this.api.getSubredditInfo(matches[2], function(info) {
                    if(info) {
                        var infoString = dbot.t('about_subreddit', {
                            'display_name': info.display_name,
                            'subscribers': info.subscribers,
                            'active': info.accounts_active
                        });
                        if(info.over18) infoString += dbot.t("nsfw");
                        callback(infoString);
                    }
                });
            }
        }.bind(this);

        dbot.api.link.addHandler(this.name, // I'm so sorry, Jesus.
            /https?:\/\/([a-z]+\.)?reddit\.com\/r\/([a-zA-Z0-9]+)(\/comments\/([a-zA-Z0-9]+)?\/([a-zA-Z0-9_]+)\/([a-zA-Z0-9_]+)?)?/, 
            rHandler);
        dbot.api.link.addHandler(this.name + 'short',
            /https?:\/\/([a-z]\.)?redd.it\/([a-zA-Z0-9]+)/,
            function(match, name, callback) {
                this.api.getPostInfo(match[2], function(info) {
                    if(info) {
                        var infoString = dbot.t('about_post', {
                            'title': _.unescape(info.title.trim()),
                            'poster': info.author,
                            'subreddit': info.subreddit,
                            'comments': info.num_comments,
                            'score': info.score,
                            'up': info.ups,
                            'down': info.downs,
                            'url': this.ApiRoot + match[2]
                        });
                        if(info.over_18) infoString += " " + dbot.t("nsfw");
                        callback(infoString);
                    }
                }.bind(this));
            }.bind(this));
    }.bind(this);
};

exports.fetch = function(dbot) {
    return new reddit(dbot);
}
