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

        },

        'tasteCompare': function(user, oUser, callback) {
            dbot.api.profile.getProfileByUUID(user.id, function(profile) {
                if(profile && profile.profile.lastfm != null) {
                    profile = profile.profile;
                    dbot.api.profile.getProfileByUUID(oUser.id, function(oProfile) {
                        if(oProfile && oProfile.profile.lastfm != null) {
                            oProfile = oProfile.profile;
                            request.get(this.ApiRoot, {
                                'qs': {
                                    'type1': 'user',
                                    'type2': 'user',
                                    'value1': profile.lastfm,
                                    'value2': oProfile.lastfm,
                                    'method': 'tasteometer.compare',
                                    'api_key': this.config.api_key,
                                    'format': 'json'
                                },
                                'json': true
                            }, function(err, res, body) {
                                console.log(body);
                                if(_.has(body, 'error') && body.error == 6 || body.error == 7) {
                                    callback('no_user', user, null);
                                } else if(_.has(body, 'comparison') && _.has(body.comparison, 'result')) {
                                    callback(null, body.comparison.result);
                                } else {
                                    callback('idk', null);
                                }
                            }); 
                        } else {
                            callback('no_oprofile', null);
                        }
                    }.bind(this));
                } else {
                    callback('no_profile', null);
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
        },

        '~taste': function(event) {
            var oNick = event.params[1];
            dbot.api.users.resolveUser(event.server, oNick, function(oUser) {
                if(oUser) {
                    this.api.tasteCompare(event.rUser, oUser, function(err, comp) {
                        if(!err) {
                            var score = Math.floor(comp.score * 100);
                            event.reply(dbot.t('taste_compat', {
                                'user1': event.user,
                                'user2': oUser.currentNick,
                                'score': score
                            }));
                        } else {
                            if(err == 'no_user') {
                                event.reply('Unknown Last.FM user.');
                            } else if(err == 'no_profile') {
                                event.reply(event.user + ': Set a lastfm username with "~set lastfm username"');
                            } else if(err == 'no_oprofile') {
                                event.reply(oUser.currentNick + ': Set a lastfm username with "~set lastfm username"');
                            } else {
                                event.reply('Well something went wrong and I don\'t know what it means');
                            }
                        }
                    });
                } else {
                    event.reply('Unknown user.');
                }
            }.bind(this));
        }
    };
};

exports.fetch = function(dbot) {
    return new lastfm(dbot);
};
