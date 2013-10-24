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
                if(profile && profile.profile,lastfm != null) {
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
                            event.reply('Unknown Last.FM user.');
                        } else if(_.has(body, 'recenttracks') && !_.isUndefined(body.recenttracks.track[0])) {
                            var track = body.recenttracks.track[0]; 
                                term = track.name + ' ' + track.artist['#text'],
                                output = '';
                            if(_.has(track, '@attr') && _.has(track['@attr'], 'nowplaying') && track['@attr'].nowplaying == 'true') {
                                output = dbot.t('now_listening', {
                                    'user': event.user,
                                    'track': track.name,
                                    'artist': track.artist['#text']
                                });
                            } else {
                                output = dbot.t('last_listened', {
                                    'user': event.user,
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
                            event.reply(dbot.t('no_listen', { 'user': event.user }));
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
