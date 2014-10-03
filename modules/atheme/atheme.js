/**
 * Module Name: atheme
 * Description: atheme mode references & retrieve channel flags
 */
var _ = require('underscore')._,
    async = require('async');

var atheme = function(dbot) {
    this.flagStack = {};
    this.hostStack = {};

    this.api = {
        'getChannelFlags': function(server, channel, callback) {
            if(!_.has(this.flagStack, server)) this.flagStack[server] = {};
            if(_.has(this.flagStack[server], channel)) { // Already an active flag call
                this.flagStack[server][channel].callbacks.push(callback);
            } else {
                this.flagStack[server][channel] = {
                    'flags': {},
                    'callbacks': [ callback ]
                };
            }

            dbot.say(server, 'chanserv', 'FLAGS ' + channel);
            setTimeout(function() { // Delete callback if no response
                if(_.has(this.flagStack[server], channel)) {
                    _.each(this.flagStack[server][channel].callbacks, function(callback) {
                        callback(true, null);
                    });
                    delete this.flagStack[server][channel];
                }
            }.bind(this), 20000);
        },

        'getVHosts': function(server, mask, callback) {
            if(!_.has(this.hostStack, server)) this.hostStack[server] = {};
            if(_.has(this.hostStack[server], mask)) { // Already an active host call
                this.hostStack[server][channel].callbacks.push(callback);
            } else {
                this.hostStack[server][mask] = {
                    'users': [],
                    'callbacks': [ callback ]
                };
            }

            dbot.say(server, 'hostserv', 'LISTVHOST ' + mask);
            setTimeout(function() { // Delete callback if no response
                if(_.has(this.hostStack[server], mask)) {
                    _.each(this.hostStack[server][mask].callbacks, function(callback) {
                        callback(true, null);
                    });
                    delete this.hostStack[server][mask];
                }
            }.bind(this), 2000);
        }
    };

    this.commands = {
        '~chanserv': function(event) {
            if(_.has(this.config.chanserv, event.input[1])) {
                event.reply('ChanServ flag ' + event.input[1] + ': ' + this.config.chanserv[event.input[1]]);
            } else {
                event.reply('I don\'t know anything about ' + event.input[1]);
            }
        },

        '~chanmode': function(event) {
            if(_.has(this.config.chanmodes, event.input[1])) {
                event.reply('Channel Mode ' + event.input[1] + ': ' + this.config.chanmodes[event.input[1]]);
            } else {
                event.reply('I don\'t know anything about ' + event.input[1]);
            }
        }
    };
    this.commands['~chanserv'].regex = [/^chanserv (\+.)/, 2];
    this.commands['~chanmode'].regex = [/^chanmode (\+.)/, 2];

    this.listener = function(event) {
        if(event.action === 'NOTICE') {
            if(event.user === 'ChanServ') {
                var flags = event.params.match(/(\d+)\s+([^ ]+)\s+(\+\w+)\s+\((\#[\w\.]+)\)/),
                    end = event.params.match(/end of \u0002(\#[\w\.]+)\u0002 flags listing/i);

                if(flags && _.has(this.flagStack[event.server], flags[4])) {
                    this.flagStack[event.server][flags[4]].flags[flags[2]] = flags[3];
                } else if(end) {
                    if(_.has(this.flagStack[event.server], end[1])) {
                        // Parse wildcard hostmasks to nicks
                        var allFlags = this.flagStack[event.server][end[1]].flags,
                            hostMasks = {};

                        _.each(allFlags, function(f, u) { // TODO: combine to one loop
                            if(u.indexOf('*!*@') !== -1) {
                                hostMasks[u] = f;
                                delete allFlags[u];
                            }
                        });

                        async.each(_.keys(hostMasks), function(hostMask, done) {
                            this.api.getVHosts(event.server, hostMask.split('@')[1], function(err, users) {
                                _.each(users, function(user) {
                                    allFlags[user] = hostMasks[hostMask];
                                });
                                done();
                            });
                        }.bind(this), function() {
                        console.log('DONE');
                            _.each(this.flagStack[event.server][end[1]].callbacks, function(callback) {
                                callback(null, this.flagStack[event.server][end[1]].flags);
                            }.bind(this));
                            delete this.flagStack[event.server][end[1]];
                        }.bind(this));
                    }
                }
            } else if(event.user === 'HostServ') {
                _.each(this.hostStack[event.server], function(el, mask) {
                    if(event.params.match(mask)) {
                        var user = event.params.match(/- ([^ ]+)/),
                            end = event.params.match(/matches for pattern/);

                        if(user) {
                            this.hostStack[event.server][mask].users.push(user[1]);
                        } else if(end) {
                            _.each(this.hostStack[event.server][mask].callbacks, function(callback) {
                                callback(null, this.hostStack[event.server][mask].users);
                            }, this);
                            delete this.hostStack[event.server][mask];
                        }
                    }
                }, this);
            }
        } else { // PRIVMSG
            var akill = event.message.match(/([^ ]+) AKILL:ADD: ([^ ]+) \(reason: (.+)(\) )\(duration: ([^,)]+)/);
            if(event.channel === '#services' && akill) {
                var channel = dbot.config.servers[server].admin_channel;
                dbot.api.report.notify('ban', 'tripsit', akill[1], channel, dbot.t('akill', {
                    'host': akill[2],
                    'reason': akill[3],
                    'duration': akill[4]
                }));
            }
        }
    }.bind(this);
    this.on = ['NOTICE', 'PRIVMSG'];
};

exports.fetch = function(dbot) {
    return new atheme(dbot);
};
