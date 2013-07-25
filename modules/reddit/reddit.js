/** 
 * Module Name: reddit
 * Description: Various reddit functionality
 */
var _ = require('underscore')._,
    request = require('request');

var reddit = function(dbot) {
    this.ApiRoot = 'http://reddit.com/';
    this.UserAgent = 'dbot by u/realitone';

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
        }
    };

    this.onLoad = function() {
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
            /https?:\/\/(www\.)?reddit\.com\/r\/([a-zA-Z0-9]+)(\/comments\/([a-zA-Z0-9]+)?\/([a-zA-Z0-9_]+)\/([a-zA-Z0-9_]+)?)?/, 
            rHandler);
    }.bind(this);
};

exports.fetch = function(dbot) {
    return new reddit(dbot);
}
