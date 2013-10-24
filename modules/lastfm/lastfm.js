/**
 * Module Name: Last.FM
 * Description: Various lastfm functionality.
 */

var _ = require('underscore')._,
   request = require('request');

var lastfm = function(dbot) {
    this.ApiRoot = 'http://ws.audioscrobbler.com/2.0/';

    this.internalAPI = {
        'getLastFM': function(server, nick, callback) {
            dbot.api.profile.getProfile(server, nick, function(err, user, profile) {
                if(user) {
                    if(profile && _.has(profile.profile, 'lastfm')) {
                        callback(user, profile.profile.lastfm);
                    } else {
                        callback(user, null);
                    }
                } else {
                    callback(null, null);
                }
            });
        }
    };

    this.api = {
        'getRandomArtistTrack': function(mbid, callback) {
            request.get(this.ApiRoot, {
                'qs': {
                    'method': 'artist.gettoptracks',
                    'mbid': mbid,
                    'api_key': this.config.api_key,
                    'format': 'json'
                },
                'json': true
            }, function(err, res, body) {
                if(_.has(body, 'toptracks') && _.has(body.toptracks, 'track')) {
                    var tracks = body.toptracks.track;
                        choice = _.random(0, tracks.length - 1),
                        track = tracks[choice];
                    callback(null, track);
                } else {
                    callback('idk', body);
                }
            });
        },
        
        'getSimilarArtists': function(mbid, callback) {
            request.get(this.ApiRoot, {
                'qs': {
                    'method': 'artist.getsimilar',
                    'mbid': mbid,
                    'api_key': this.config.api_key,
                    'format': 'json'
                },
                'json': true
            }, function(err, res, body) {
                if(_.has(body, 'similarartists') && _.has(body.similarartists, 'artist')) {
                    callback(null, body.similarartists.artist);
                } else {
                    callback('idk', body);
                }
            });
        },

        'getListening': function(username, callback) {
            request.get(this.ApiRoot, {
                'qs': {
                    'user': username,
                    'limit': 2,
                    'nowplaying': true,
                    'method': 'user.getrecenttracks',
                    'api_key': this.config.api_key,
                    'format': 'json'
                },
                'json': true
            }, function(err, res, body) {
                if(_.has(body, 'error') && body.error == 6) {
                    callback('no_user', null);
                } else if(_.has(body, 'recenttracks') && !_.isUndefined(body.recenttracks.track[0])) {
                    callback(null, body.recenttracks.track[0]);
                } else {
                    callback('no_listen', null);
                }
            }); 
        },

        'tasteCompare': function(user, oUser, callback) {
            request.get(this.ApiRoot, {
                'qs': {
                    'type1': 'user',
                    'type2': 'user',
                    'value1': user,
                    'value2': oUser,
                    'method': 'tasteometer.compare',
                    'api_key': this.config.api_key,
                    'format': 'json'
                },
                'json': true
            }, function(err, res, body) {
                if(_.has(body, 'error') && body.error == 6 || body.error == 7) {
                    callback('no_user', user, null);
                } else if(_.has(body, 'comparison') && _.has(body.comparison, 'result')) {
                    callback(null, body.comparison.result);
                } else {
                    callback('idk', null);
                }
            }); 
        }
    };

    this.commands = {
        '~suggestion': function(event) {
            if(event.rProfile && _.has(event.rProfile, 'lastfm')) {
                this.api.getListening(event.rProfile.lastfm, function(err, track) {
                    if(!err) {
                        this.api.getSimilarArtists(track.artist.mbid, function(err, similar) {
                            if(!err) {
                                var choice = _.random(0, similar.length - 1); 
                                this.api.getRandomArtistTrack(similar[choice].mbid, function(err, track) {
                                    if(!err) {
                                        var output = dbot.t('lfm_suggestion', {
                                            'user': event.user,
                                            'name': track.name,
                                            'artist': track.artist.name
                                        });
                                        var term = track.name + ' ' + track.artist.name;
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
                                        event.reply('something broke');
                                    }
                                }); 
                            } else {
                                event.reply('something broke');
                            }
                        }.bind(this));
                    } else {
                        if(err == 'no_user') {
                            event.reply('Unknown Last.FM user.');
                        } else if(err == 'no_listen') {
                            event.reply(dbot.t('no_listen', { 'user': event.user }));
                        }
                    }
                }.bind(this));
            } else {
                event.reply(event.user + ': Set a lastfm username with "~set lastfm username"');
            }
        },

        '~listening': function(event) {
            var getListening = function(user, lfm) {
                if(user && lfm) {
                    this.api.getListening(lfm, function(err, track) {
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
                                event.reply('Unknown LastFM user.');
                            } else if(err == 'no_listen') {
                                event.reply(dbot.t('no_listen', { 'user': user.currentNick }));
                            }
                        }
                    });
                } else {
                    if(!user) {
                        event.reply('Unknown user.');
                    } else {
                        event.reply(user.currentNick + ': Set a lastfm username with "~set lastfm username"');
                    }
                }
            }.bind(this);

            if(event.params[1]) {
                this.internalAPI.getLastFM(event.server, event.params[1], getListening);
            } else {
                getListening(event.rUser, event.rProfile.lastfm);
            }
        },

        '~taste': function(event) {
            if(event.rProfile && _.has(event.rProfile, 'lastfm')) {
                this.internalAPI.getLastFM(event.server, event.params[1], function(u2, lfm2) {
                    if(u2 && lfm2) {
                        this.api.tasteCompare(event.rProfile.lastfm, lfm2, function(err, comp) {
                            if(!err) {
                                var score = Math.floor(comp.score * 100);
                                event.reply(dbot.t('taste_compat', {
                                    'user1': event.user,
                                    'user2': u2.currentNick,
                                    'score': score
                                }));
                            } else {
                                if(err == 'no_user') {
                                    event.reply('Unknown Last.FM user.');
                                } else {
                                    event.reply('Well something went wrong and I don\'t know what it means');
                                }
                            }
                        });
                    } else {
                        if(!u2) {
                            event.reply('No such user.');
                        } else {
                            event.reply(u2.currentNick + ': Set a lastfm username with "~set lastfm username"');
                        }
                    }
                }.bind(this));
            } else {
                event.reply(event.user + ': Set a lastfm username with "~set lastfm username"');
            }
        }
    };
};

exports.fetch = function(dbot) {
    return new lastfm(dbot);
};
