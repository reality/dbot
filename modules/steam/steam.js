/**
 * Module Name: Steam
 * Description: Various steam functionality.
 */

var _ = require('underscore')._,
   request = require('request');

var steam = function(dbot) {
    this.ApiRoot = 'http://api.steampowered.com/';

    this.internalAPI = {
        'getSteam': function(server, nick, callback) {
            dbot.api.profile.getProfile(server, nick, function(err, user, profile) {
                if(user) {
                    if(profile && _.has(profile.profile, 'steam')) {
                        callback(user, profile.profile.steam);
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
        // TODO: Cache this shit yo
        'getSteamID': function(nick, callback) {
            request.get(this.ApiRoot + 'ISteamUser/ResolveVanityURL/v0001/', {
                'qs': {
                    'key': this.config.api_key,
                    'vanityurl': nick,
                    'format': 'json'
                },
                'json': true
            }, function(err, res, body) {
                if(body.response.success == 1) {
                    callback(null, body.response.steamid); 
                } else if(body.response.success == 42) {
                    callback('no_user', body.response.steamid); 
                }
            });
        },

        'getRecentlyPlayed': function(steamid, callback) {
            request.get(this.ApiRoot + 'IPlayerService/GetRecentlyPlayedGames/v0001/', {
                'qs': {
                    'key': this.config.api_key,
                    'steamid': steamid,
                    'format': 'json'
                },
                'json': true
            }, function(err, res, body) {
                if(_.has(body, 'response') && _.has(body.response, 'total_count')) {
                    callback(null, body.response);
                } else {
                    callback(true, null);
                }
            });
        },

        'getProfile': function(steamid, callback) {
             request.get(this.ApiRoot + 'ISteamUser/GetPlayerSummaries/v0002/', {
                'qs': {
                    'key': this.config.api_key,
                    'steamids': steamid,
                    'format': 'json'
                },
                'json': true
            }, function(err, res, body) {
                if(_.has(body, 'response') && _.has(body.response, 'players') && body.response.player != null) {
                    callback(null, body.response.players[0]);
                } else {
                    callback(true, null);
                }
            });
        }
    };

    this.commands = {
        '~game': function(event) {
            var user = event.rUser,
                snick = event.rProfile.steam;
            if(event.res[0]) {
                user = event.res[0].user;
                snick = event.res[0].snick;
            }

            this.api.getSteamID(snick, function(err, steamid) {
                this.api.getProfile(steamid, function(err, player) {
                    if(!err) {
                        if(_.has(player, 'gameextrainfo')) {
                            var output = dbot.t('steam_currently_playing', {
                                'user': user.currentNick,
                                'game': player.gameextrainfo
                            });
                            if(_.has(player, 'gameserverip')) {
                                var host = player.gameserverip.split(':');
                                :qa
                                :qa
                                output += ' (Server: ' + host[0] + ' Port: ' + host[1] + ')';
                            }
                            event.reply(output);
                        } else {
                            this.api.getRecentlyPlayed(steamid, function(err, games) {
                                if(!err) {
                                    if(games.total_count != 0) {
                                        event.reply(dbot.t('steam_last_played', {
                                            'user': user.currentNick,
                                            'game': games.games[0].name
                                        }));
                                    } else {
                                        event.reply(dbot.t('steam_not_played', {
                                            'user': user.currentNick
                                        }));
                                    }
                                } else {
                                    event.reply('Unknown Steam Username');
                                }
                            });
                        }
                    } else {
                        event.reply('Unknown Steam Username');
                    }
                }.bind(this));
            }.bind(this));
        }
    };

    _.each(this.commands, function(command) {
        command.resolver = function(event, callback) {
            if(event.rProfile && _.has(event.rProfile, 'steam')) {
                if(event.params[1]) {
                    this.internalAPI.getSteam(event.server, event.params[1], function(user, snick) {
                        if(user && snick) {
                            event.res.push({
                                'user': user,
                                'snick': snick 
                            });
                            callback(false); 
                        } else {
                            if(!user) {
                                event.reply('Unknown user.');
                            } else {
                                event.reply(user.currentNick + ': Set a steam "vanity url" with "~set steam username"'); 
                            }
                            callback(true);
                        }
                    });
                } else {
                    callback(false);
                }
            } else {
                event.reply(event.user + ': Set a steam "vanity url" with "~set steam username"'); 
                callback(true);
            }
        }.bind(this);
    }, this);

};

exports.fetch = function(dbot) {
    return new steam(dbot);
};
