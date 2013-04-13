/** 
 * Module Name: reddit
 * Description: Various reddit functionality
 */
var _ = require('underscore')._,
    request = require('request');

var reddit = function(dbot) {
    this.ApiRoot = 'http://reddit.com/';

    this.api = {
        'getSubredditInfo': function(name, callback) {
            request.get({
                'url': this.ApiRoot + 'r/' + name + '/about.json',
                'json': true,
                'headers': {
                    'User-Agent': 'dbot by u/realitone'
                }
            }, function(err, response, body) {
                callback(body);
            });
        }
    };

    this.onLoad = function() {
        var srHandler = function(event, matches, name) {
            this.api.getSubredditInfo(matches[1], function(info) {
                if(info.data) {
                    info = info.data;
                    var infoString = dbot.t('about_subreddit', {
                        'display_name': info.display_name,
                        'subscribers': info.subscribers,
                        'active': info.accounts_active
                    });
                    if(info.over18) infoString += ' [NSFW]';
                    event.reply(infoString);
                }
            });
        }.bind(this);
        dbot.api.link.addHandler(this.name, /https?:\/\/reddit\.com\/r\/([a-zA-Z0-9]+)/, srHandler);
    }.bind(this);
};

exports.fetch = function(dbot) {
    return new reddit(dbot);
}
