/**
 * Module Name: Last.FM
 * Description: Various lastfm functionality.
 */

var _ = require('underscore')._,
    request = require('request'),
    async = require('async'),
    moment = require('moment');

var lastfm = function(dbot) {
    this.ApiRoot = 'http://ws.audioscrobbler.com/2.0/';

    this.internalAPI = {
        'getLastFM': function(server, nick, callback) {
            dbot.api.profile.getProfile(server, nick, function(err, user, profile) {
                if(user) {
                    if(profile && _.has(profile.profile, 'lastfm') && _.isString(profile.profile.lastfm)) {
                        callback(user, profile.profile.lastfm.toLowerCase());
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
                    'format': 'json',
                    'limit': 10
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
                    'format': 'json',
                    'limit': 10
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
                } else if(_.has(body, 'recenttracks') && _.has(body.recenttracks, 'track') 
                        && !_.isUndefined(body.recenttracks.track[0])) {
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
        },

        'getInfo': function(lfm, callback) {
            request.get(this.ApiRoot, {
                'qs': {
                    'user': lfm,
                    'method': 'user.getinfo',
                    'api_key': this.config.api_key,
                    'format': 'json'
                },
                'json': true
            }, function(err, res, body) {
                if(_.has(body, 'error') && body.error == 6 || body.error == 7) {
                    callback('no_user', null);
                } else if(_.has(body, 'user')) {
                    callback(null, body.user);
                } else {
                    callback('idk', null);
                }
            }); 

        }
    };

    this.commands = {
        '~lastfm': function(event) {
            var user = event.rUser,
                lfm = event.rProfile.lastfm;
            if(event.res[0]) {
                user = event.res[0].user;
                lfm = event.res[0].lfm;
            }

            this.api.getInfo(lfm, function(err, profile) {
                if(!err) {
                    console.log(profile);
                    event.reply(dbot.t('lfm_profile', {
                        'user': user.currentNick,
                        'plays': profile.playcount.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,"),
                        'date': moment(profile.registered['#text']).format('DD/MM/YYYY'),
                        'link': profile.url
                    }));
                } else {
                    if(err == 'no_user') {
                        event.reply('Unknown Last.FM user.');
                    } else if(err == 'no_listen') {
                        event.reply(dbot.t('no_listen', { 'user': event.user }));
                    }
                }
            });
        },

        '~scrobbliest': function(event) {
            dbot.api.profile.getAllProfilesWith('lastfm', function(profiles) {
                if(profiles) {
                    var plays = [];
                    async.each(profiles, function(profile, done) {
                        this.api.getInfo(profile.profile.lastfm, function(err, lProfile) {
                            if(!err) {
                                plays.push({
                                    'user': profile.id,
                                    'plays': parseInt(lProfile.playcount)
                                });
                            }
                            done();
                        });
                    }.bind(this), function() {
                        var scrobbliest = _.chain(plays)
                            .sortBy(function(p) { return p.plays; })
                            .reverse()
                            .first(10)
                            .value();

                        async.each(scrobbliest, function(item, done) {
                            dbot.api.users.getUser(item.user, function(err, user) {
                                item.user = user; 
                                done();
                            });
                        }, function() {
                            var output = dbot.t('lfm_scrobbliest');
                            _.each(scrobbliest, function(item) {
                                output += item.user.currentNick + ' (' +
                                    item.plays.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")+ '), ';
                            });
                            event.reply(output.slice(0, -2));
                        });
                    }.bind(this));
                } else {
                    event.reply('no suitable profiles');
                } 
            }.bind(this));
        },

        '~suggestion': function(event) {
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
                                       if(_.isObject(body) && _.has(body, 'items') && body.items.length > 0) {
                                            var link = body.items[0].id.videoId
                                            if(link) {
                                                output += ' - http://youtu.be/' + link;
                                            }
                                        }

                                        dbot.api.spotify.spotifySearch(term, function(body, t) {
                                          if(body) {
                                            output += ' - ' + t;
                                          }

                                          event.reply(output);
                                        });
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
        },

        '~listening': function(event) {
            var user = event.rUser,
                lfm = event.rProfile.lastfm;
            if(event.res[0]) {
                user = event.res[0].user;
                lfm = event.res[0].lfm;
            }

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
                        if(_.isObject(body) && _.has(body, 'items') && body.items.length > 0) {
                                var link = body.items[0].id.videoId
                            if(link) {
                                output += ' - http://youtu.be/' + link;
                            }
                        }

                /*        dbot.api.spotify.spotifySearch(term, function(body, t) {
                          if(body) {
                            output += ' - ' + t;
                          }

                        });*/
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
        },

        '~taste': function(event) {
            var u1 = event.rUser,
                lfm1 = event.rProfile.lastfm,
                u2 = event.res[0].user,
                lfm2 = event.res[0].lfm;

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
        },

        '~tastiest': function(event) {
            var sortGoodScores = function(goodScores) {
                var tastiest = _.chain(goodScores)
                    .sortBy(function(p) { return p.score; })
                    .reverse()
                    .first(10)
                    .value();

                async.each(tastiest, function(pair, done) {
                    if(!_.isObject(pair.p1)) { // fix this
                        dbot.api.users.getUser(pair.p1, function(err, user) {
                            pair.p1 = user;
                            dbot.api.users.getUser(pair.p2, function(err, user) {
                                pair.p2 = user;
                                done();
                            });
                        }); 
                    } else {
                        done();
                    }
                }, function() {
                    var output = 'Most musically compatible users: ';    
                    _.each(tastiest, function(pair) {
                        output += pair.p1.currentNick + ' & ' + 
                            pair.p2.currentNick + ' (' + pair.score +
                            '%), ';
                    });
                    event.reply(output.slice(0, -2));
                });
            };

            if(this.tastyCache && Date.now() - this.tastyCacheStamp <= 1800000) {
                sortGoodScores(this.tastyCache);
            } else {
                event.reply('Updating tasty cache... Hold onto your coconuts...');
                dbot.api.profile.getAllProfilesWith('lastfm', function(profiles) {
                    if(profiles) {
                        var scores = {}; // Using this structure first for easier testing in the async
                        async.eachSeries(profiles, function(p1, next) {
                            scores[p1.id] = {};
                            async.eachSeries(profiles, function(p2, subnext) {
                                if(p1.id == p2.id || p1.profile.lastfm == p2.profile.lastfm || _.has(scores, p2.id) && _.has(scores[p2.id], p1.id)) {
                                    subnext();
                                } else {
                                    this.api.tasteCompare(p1.profile.lastfm, p2.profile.lastfm, function(err, comp) {
                                        if(!err) {
                                            var score = Math.floor(comp.score * 100);
                                            scores[p1.id][p2.id] = score;
                                        }
                                        subnext();
                                    });
                                }
                            }.bind(this), function() { next(); });
                        }.bind(this), function(err) {
                            // Now we better structure the scores for sorting
                            var goodScores = [];
                            _.each(scores, function(subscores, p1) {
                                _.each(subscores, function(aScore, p2) {
                                    goodScores.push({
                                        'p1': p1,
                                        'p2': p2,
                                        'score': aScore
                                    }); 
                                });
                            });

                            this.tastyCache = goodScores;
                            this.tastyCacheStamp = new Date().getTime();
                            sortGoodScores(goodScores);
                        }.bind(this));
                    } else {
                        event.reply('No suitable profiles');
                    }
                }.bind(this));
            }
        },

        '~artists': function(event) {
            var u1 = event.rUser,
                lfm1 = event.rProfile.lastfm,
                u2 = event.res[0].user,
                lfm2 = event.res[0].lfm;

            this.api.tasteCompare(event.rProfile.lastfm, lfm2, function(err, comp) {
                if(!err) {
                    var artists = _.pluck(comp.artists.artist, 'name').join(', ');
                    event.reply(dbot.t('common_artists', {
                        'user1': event.user,
                        'user2': u2.currentNick,
                        'common': artists
                    }));
                } else {
                    if(err == 'no_user') {
                        event.reply('Unknown Last.FM user.');
                    } else {
                        event.reply('Well something went wrong and I don\'t know what it means');
                    }
                }
            });
        }
    };
    this.commands['~taste'].regex = [/^taste ([\d\w[\]{}^|\\`_-]+?)/, 2];
    this.commands['~artists'].regex = [/^artists ([\d\w[\]{}^|\\`_-]+?)/, 2];

    _.each(this.commands, function(command) {
        command.resolver = function(event, callback) {
            if(event.rProfile && _.has(event.rProfile, 'lastfm')) {
                if(event.params[1]) {
                    this.internalAPI.getLastFM(event.server, event.params[1], function(user, lfm) {
                        if(user && lfm) {
                            event.res.push({
                                'user': user,
                                'lfm': lfm
                            });
                            callback(false); 
                        } else {
                            if(!user) {
                                event.reply('Unknown user.');
                            } else {
                                event.reply(user.currentNick + ': Set a lastfm username with "~set lastfm username"'); 
                            }
                            callback(true);
                        }
                    });
                } else {
                    callback(false);
                }
            } else {
                event.reply(event.user + ': Set a lastfm username with "~set lastfm username"'); 
                callback(true);
            }
        }.bind(this);
    }, this);
};

exports.fetch = function(dbot) {
    return new lastfm(dbot);
};
