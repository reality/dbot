/**
 * Module Name: soundcloud
 * Description: Various SoundCloud functionality
 */
var _ = require('underscore')._,
    request = require('request');

var soundcloud = function(dbot) {
    this.ApiRoot = 'http://api.soundcloud.com';

    this.onLoad = function() {
        dbot.api.link.addHandler(this.name, 
            /https?:\/\/(www\.)?soundcloud\.com\//,
            function(event, match, name) {
                var url = match.input;
                request.get(this.ApiRoot + '/resolve.json', {
                    'qs': {
                        'client_id': this.config.client_id,
                        'url': url
                    },
                    'json': true
                }, function(error, response, body) {
                    if(response.statusCode == 200) {
                        if(body.kind == 'track') {
                            event.reply(dbot.t('sc_track', {
                                'title': body.title,
                                'artist': body.user.username,
                                'genre': body.genre.trim(),
                                'plays': body.playback_count,
                                'favs': body.favoritings_count
                            }));
                       }
                    }
                });
            }.bind(this));
    }.bind(this);
};

exports.fetch = function(dbot) {
    return new soundcloud(dbot);
};
