/**
 * Module Name: Last.FM
 * Description: Various lastfm functionality.
 */

var _ = require('underscore')._,
   request = require('request');

var lastfm = function(dbot) {
    this.ApiRoot = 'http://ws.audioscrobbler.com/2.0/';

    this.api = {
        'getListening': function(user, callback) {
            dbot.api.profile.getProfileByUUID(user.id, function(profile) {
                if(profile && profile.profile.lastfm != null) {
                    profile = profile.profile;
                    request.get(this.ApiRoot, {
                        'qs': {
                            'user': profile.lastfm,
                            'limit': 2,
                            'nowplaying': true,
                            'method': 'user.getrecenttracks',
                            'api_key': this.config.api_key,
                            'format': 'json'
                        },
                        'json': true
                    }, function(err, res, body) {
                        if(_.has(body, 'error') && body.error == 6) {
                            callback('no_user', user, null);
                        } else if(_.has(body, 'recenttracks') && !_.isUndefined(body.recenttracks.track[0])) {
                            callback(null, user, body.recenttracks.track[0]);
                        } else {
                            callback('no_listen', user, null);
                        }
                    }); 
                } else {
                    callback('no_profile', user, null);
                }
            }.bind(this));

        }
    };

    this.commands = {
        '~listening': function(event) {
            var outputListening = function(err, user, track) {
                if(!err) {
                    var term = track.name + ' ' + track.artist['#text'],
                        output = '';
                    if(_.has(track, '@attr') && _.has(track['@attr'], 'nowplaying') && track['@attr'].nowplaying == 'true') {
                        output = dbot.t('now_listening', {
                            'user': user.currentNick,
                            'track': track.name,
                            'artist': track.artist['#text']
                        });
                    } else {
                        output = dbot.t('last_listened', {
                            'user': user.currentNick,
                            'track': track.name,
                            'artist': track.artist['#text']
                        });
                    }
                    dbot.api.youtube.search(term, function(body) {
                        if(_.isObject(body) && _.has(body, 'feed') && _.has(body.feed, 'entry')) {
                            var v = body.feed.entry[0];
                                link = v.link[0].href.match(dbot.modules.youtube.LinkRegex);
                            if(link) {
                                output += ' - http://youtu.be/' + link[2];
                            }
                        }
                        event.reply(output);
                    });
                } else {
                    if(err == 'no_user') {
                        event.reply('Unknown Last.FM user.');
                    } else if(err == 'no_listen') {
                        event.reply(dbot.t('no_listen', { 'user': user.currentNick }));
                    } else if(err == 'no_profile') {
                        event.reply('Set a lastfm username with "~set lastfm username"');
                    }
                }
            };

            if(event.params[1]) {
                dbot.api.users.resolveUser(event.server, event.params[1], function(user) {
                    if(user) {
                        this.api.getListening(user, outputListening);
                    } else {
                        event.reply('Unrecognised user.');
                    }
                }.bind(this));
            } else {
                this.api.getListening(event.rUser, outputListening);
            }
        }
    };
};

exports.fetch = function(dbot) {
    return new lastfm(dbot);
};
