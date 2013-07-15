/**
 * Module Name: youtube
 * Description: Various Youtube functionality
 */
var _ = require('underscore')._,
    request = require('request');

var youtube = function(dbot) {
    this.ApiRoot = 'https://gdata.youtube.com/feeds/api';
    this.params = {
        'alt': 'json',
        'v': 2
    };

    this.onLoad = function() {
        dbot.api.link.addHandler(this.name,
            /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/,
            function(event, match, name) {
                request.get(this.ApiRoot + '/videos/' + match[2], {
                    'qs': this.params,
                    'json': true
                }, function(error, response, body) {
                    if(_.isObject(body) && _.has(body, 'entry')) {
                        var v = body.entry;
                        event.reply(dbot.t('yt_video', {
                            'title': v.title['$t'],
                            'plays': v['yt$statistics'].viewCount,
                            'author': v.author[0].name['$t'],
                            'likes': v['yt$rating'].numLikes,
                            'dislikes': v['yt$rating'].numDislikes
                        }));
                    }
                });
            }.bind(this));
    }.bind(this);
};

exports.fetch = function(dbot) {
    return new youtube(dbot);
};
