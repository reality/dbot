/**
 * Module Name: Last.FM
 * Description: Various lastfm functionality.
 */

var _ = require('underscore')._,
   request = require('request');

var lastfm = function(dbot) {
    this.ApiRoot = 'http://ws.audioscrobbler.com/2.0/';

    this.commands = {
        '~listening': function(event) {
            dbot.api.profile.getProfileByUUID(event.rUser.id, function(profile) {
                if(profile && _.has(profile.profile, 'lastfm')) {
                    profile = profile.profile;
                    request.get(this.ApiRoot, {
                        'qs': {
                            'user': profile.lastfm,
                            'limit': 1,
                            'nowplaying': true,
                            'method': 'user.getrecenttracks',
                            'api_key': this.config.api_key,
                            'format': 'json'
                        },
                        'json': true
                    }, function(err, res, body) {
                        if(_.has(body, 'error') && body.error == 6) {
                            event.reply('Unknown Last.FM user.');
                        } else if(_.has(body, 'recenttracks') && !_.isUndefined(body.recenttracks.track[0])) {
                            var track = body.recenttracks.track[0]; 
                            event.reply(event.user + ' is listening to ' + track.name + ' by ' + track.artist['#text']);
                        } else {
                            event.reply(event.user + ' isn\'t listening to anything right now :\'(');
                        }
                    }); 
                } else {
                    event.reply('Set a lastfm username with "~set lastfm username"');
                }
            }.bind(this));
        }
    };
};

exports.fetch = function(dbot) {
    return new lastfm(dbot);
};
