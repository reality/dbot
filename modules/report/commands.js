var _ = require('underscore')._,
    moment = require('moment'),
    async = require('async');

var commands = function(dbot) {
    var commands = {
        '~ncount': function(event) {
            var chanCounts = {},
                typeCounts = {},
                total = 0,
                offString = event.params[1] || null;
                offset = moment().subtract(offString, 1).valueOf() || null;

            /*if(!offset || !offset.isValid()) {
                event.reply('Invalid timescale. Try \'week\'');
                return;
            }*/

            this.db.scan('notifies', function(notify) {
                if(notify.user == event.rUser.id) {
                    if(!offString) {
                        if(!_.has(chanCounts, notify.channel)) chanCounts[notify.channel] = 0;
                        if(!_.has(typeCounts, notify.type)) typeCounts[notify.type] = 0;
                        chanCounts[notify.channel]++;
                        typeCounts[notify.type]++;
                        total++;
                    } else {
                        if(notify.time > offset) {
                            if(!_.has(chanCounts, notify.channel)) chanCounts[notify.channel] = 0;
                            if(!_.has(typeCounts, notify.type)) typeCounts[notify.type] = 0;
                            chanCounts[notify.channel]++;
                            typeCounts[notify.type]++;
                            total++;
                        }
                    }
                }
            }, function() {
                var cCounts = _.chain(chanCounts)
                    .pairs()
                    .sortBy(function(p) { return p[1]; })
                    .reverse()
                    .first(10)
                    .value();

                var cString = '';
                for(var i=0;i<cCounts.length;i++) {
                    cString += cCounts[i][0] + " (" + cCounts[i][1] + "), ";
                }
                cString = cString.slice(0, -2);

                var tCounts = _.chain(typeCounts)
                    .pairs()
                    .sortBy(function(p) { return p[1]; })
                    .reverse()
                    .first(10)
                    .value();

                var tString = '';
                for(var i=0;i<tCounts.length;i++) {
                    tString += tCounts[i][0] + " (" + tCounts[i][1] + "), ";
                }
                tString = tString.slice(0, -2);

                if(offString) {
                    event.reply(dbot.t('timed_notifies', {
                        'user': event.user,
                        'count': total,
                        'offString': offString,
                        'cString': cString,
                        'tString': tString
                    }));
                } else {
                    event.reply(dbot.t('total_notifies', {
                        'user': event.user,
                        'count': total,
                        'cString': cString,
                        'tString': tString
                    }));
                }
            });
        },

        '~sustatus': function(event) {
            var user = event.input[1];

            dbot.api.users.resolveUser(event.server, user, function(err, user) {
                if(user) {
                    dbot.api.users.getUserAliases(user.id, function(err, aliases) {
                        var ban = 0,
                            latest_ban = {'time':0},
                            latest_unban = {'time':0},
                            unban = 0,
                            quiet = 0,
                            warn = 0,
                            report = 0,
                            items = {};
                        aliases.push(user.primaryNick);

                        dbot.modules.report.db.search('notifies', {
                            'server': event.server
                        }, function(notify) {
                            _.each(aliases, function(alias) {
                                if(notify.message.match('banned ' + alias) || 
                                   notify.message.match(alias + ' has been unbanned') || 
                                   notify.message.match('issued a warning to ' + alias) || 
                                   notify.message.match('has quieted ' + alias) ||
                                   notify.message.match('has reported ' + alias)) {
                                    if(notify.type == 'ban') {
                                        ban++;
                                        if(notify.time > latest_ban.time) {
                                            latest_ban = notify;
                                        }
                                    } else if(notify.type == 'unban') {
                                        unban++;
                                        if(notify.time > latest_unban.time) {
                                            latest_unban = notify;
                                        }
                                    } else if(notify.type == 'quiet') {
                                        quiet++;
                                    } else if(notify.type == 'warn') {
                                        warn++;
                                    } else if(notify.type == 'report') {
                                        report++;
                                    }
                                    items[notify.time] = notify.message;
                                }
                            });
                        }, function() {
                            if(quiet != 0 || warn != 0 || report != 0) {
                                event.reply(user.primaryNick + ' has been warned ' + warn + ' times, quieted ' + quiet + ' times, and reported ' + report + ' times.');

                                var sTimes = _.keys(items).sort(function(a, b) {
                                    return parseInt(a) - parseInt(b);
                                });
                                
                                _.each(sTimes, function(time) {
                                    event.reply('[' + moment(parseInt(time)).format('DD/MM/YYYY') + '] ' + items[time]); 
                                });

                                if(latest_ban.time != 0) {
                                    if(latest_unban.time == 0 || (latest_unban.time < latest_ban.time)) {
                                        event.reply('Current Ban Status: \u00034Banned\u000f since ' + moment(latest_ban.time).fromNow() + ' (' + moment(parseInt(latest_ban.time)).format('DD/MM/YYYY') + ')');
                                        event.reply('Reason: ' + latest_ban.message);
                                    } else {
                                        var a = moment(latest_ban.time);
                                        var b = moment(latest_unban.time);
                                        event.reply('Current Ban Status: \u00037Unbanned\u000f since ' + moment(parseInt(latest_unban.time)).format('DD/MM/YYYY') + ' after being banned for ' + b.diff(a, 'days') + ' days');
                                        event.reply('Most recent ban reason: ' + latest_ban.message);
                                    }
                                } else {
                                    event.reply('Current Ban Status: \u00033Never banned (\u00037probably\u00033)\u000f');
                                }
                            } else {
                                event.reply(user.primaryNick + ' has no record.');
                            }
                        });
                    }.bind(this));
                } else {
                    event.reply('never heard of em');
                }
            }.bind(this));

        },

        '~ustatus': function(event) {
            var user = event.input[1];

            dbot.api.users.resolveUser(event.server, user, function(err, user) {
                if(user) {
                    var ban = null,
                        quiet = 0
                        warn = 0;

// i'll fix it later
                    dbot.modules.report.db.search('notifies', {
                        'server': event.server
                    }, function(notify) {
                        if(notify.message.match('banned ' + user.primaryNick) || notify.message.match('issued a warning to ' + user.primaryNick) || notify.message.match('has quieted ' + user.primaryNick)) {
                            if(notify.type == 'ban') {
                                ban = notify.time;
                            } else if(notify.type == 'quiet') {
                                quiet++;
                            } else if(notify.type == 'warn') {
                                warn++;
                            }
                        }
                    }, function() {
                        if(ban) {
                            event.reply(user.primaryNick + ' was banned on ' + new Date(ban).toUTCString());
                        } else if(quiet != 0 || warn != 0) {
                            event.reply(user.primaryNick + ' has been warned ' + warn + ' times, and quieted ' + quiet + ' times.');
                        } else {
                            event.reply(user.primaryNick + ' has no record.');
                        }
                    });
                } else {
                    event.reply('never heard of em');
                }
            }.bind(this));
        },

        '~clearmissing': function(event) {
            if(_.has(this.pending, event.rUser.id)) {
                var count = this.pending[event.rUser.id].length;
                delete this.pending[event.rUser.id];
                event.reply(dbot.t('cleared_notifies', { 'count': count }));
            } else {
                event.reply(dbot.t('no_missed_notifies'));
            }
        },

        '~report': function(event) {
            var channelName = (event.input[1] || event.channel.toString()),
                nick = event.input[2],
                reason = event.input[3].trim();
            channelName = channelName.trim();

            if(channelName == event.user) {
                channelName = dbot.config.servers[event.server].admin_channel;
            }

            if(reason.charAt(reason.length - 1) != '.') reason += '.';

            dbot.api.users.resolveUser(event.server, nick, function(err, reportee) {
                if(_.has(event.allChannels, channelName)) {
                    if(reportee) {
                        this.api.notify('report', event.server, event.rUser,
                        channelName, dbot.t('report', {
                            'reporter': event.rUser.primaryNick,
                            'reportee': nick,
                            'reason': reason
                        }));
                        event.reply(dbot.t('reported', { 'reported': nick }));
                    } else {
                        event.reply(dbot.t('user_not_found', { 
                            'reported': nick,
                            'channel': channelName 
                        }));
                    }
                } else {
                    event.reply(dbot.t('not_in_channel', { 'channel': channelName }));
                }
            }.bind(this));
        },

        '~notify': function(event) {
            var channelName = event.input[1],
                message = event.input[2];

            if(_.has(event.allChannels, channelName)) {
                if(this.config.firstHost) {
                    var first = message.split(' ')[0];
                    dbot.api.users.resolveUser(event.server, first, function(err, user) {
                        if(user && _.include(this.config.host_lookup, channelName)) {
                            dbot.api.nickserv.getUserHost(event.server, first, function(host) {
                                message = message.replace(first, first + ' [' + host + ']'); 
                                this.api.notify('notify', event.server, event.rUser, channelName, message, host);
                            }.bind(this)); 
                        } else {
                            this.api.notify('notify', event.server, event.rUser, channelName, message);
                        }
                    }.bind(this));
                } else {
                    this.api.notify('notify', event.server, event.rUser, channelName, message);
                }

                event.reply(dbot.t('notified', {
                    'user': event.user,
                    'channel': channelName
                }));
            } else {
                event.reply(dbot.t('not_in_channel', { 'channel': channelName }));
            }
        },

        '~nunsub': function(event) {
            var cName = event.input[1],
                cId = event.input[1] + '.' + event.server;
            
            if(_.has(dbot.instance.connections[event.server].channels, cName)) {
                this.db.read('nunsubs', cId, function(err, nunsubs) {
                    if(!nunsubs) {
                        var nunsubs = {
                            'id': cId,
                            'users': []
                        }
                    } 

                    if(!_.include(nunsubs, event.rUser.id)) {
                        nunsubs.users.push(event.rUser.id); 
                        this.db.save('nunsubs', cId, nunsubs, function() {
                            var reply = dbot.t('nunsubbed', { 'cName': cName })
                            if(_.has(this.config.chan_redirs, cName)) {
                                reply += dbot.t('n_also_found', { 'afaName' : this.config.chan_redirs[cName] });
                            }
                            event.reply(reply); 
                        }.bind(this));
                    } else {
                        event.reply(dbot.t('already_nunsubbed', { 'cName': cName }));
                    }
                }.bind(this));
            } else {
                event.reply('Channel not known.');
            }
        },
        
        '~ununsub': function(event) {
            var cName = event.input[1],
                cId = event.input[1] + '.' + event.server;

            if(_.has(dbot.instance.connections[event.server].channels, cName)) {
                this.db.read('nunsubs', cId, function(err, nunsubs) {
                    if(!_.isUndefined(nunsubs) && _.include(nunsubs.users, event.rUser.id)) {
                        nunsubs.users = _.without(nunsubs.users, event.rUser.id);
                        this.db.save('nunsubs', cId, nunsubs, function() {
                            event.reply(dbot.t('ununsubbed', { 'cName': cName }));
                        });
                    } else {
                        event.reply(dbot.t('not_nunsubbed', { 'cName': cName }));
                    }
                }.bind(this));
            } else {
                event.reply('Channel not known.');
            }
        },

        '~concerning': function(event) {
            var nick = event.params[1].trim();
            dbot.api.nickserv.getUserHost(event.server, nick, function(host) {
                if(host) {
                    var results = [];
                    this.db.scan('notifies', function(notify) {
                        if(notify && _.has(notify, 'host') && (notify.host == host || notify.message.split(' ')[0] == nick)) {
                            results.push(notify);
                        }
                    }, function() {
                        event.reply(nick + ' has sought help ' + results.length + ' times under the host ' + host + ' or nick ' + nick); 
                        _.each(results, function(n) {
                            event.reply('[' + moment(parseInt(n.time)).format('DD/MM/YYYY') + '][' + n.user.split('.')[0] + '] ' + n.message); 
                        });
                    });
                } else {
                    dbot.api.quotes.getQuote('deal with it', function(quote) {
                        var out = 'Couldn\'t find user\'s host, but that doesn\'t necessarily mean they don\'t exist. This is the lazy way of doing it for now... ';
                        if(quote) {
                            out += quote;
                        }
                        event.reply(out);
                    });
                }
            }.bind(this));
        }
    };
    commands['~report'].regex = /^report (#[^ ]+ )?([^ ]+) (.*)$/;
    commands['~notify'].regex = [/^notify ([^ ]+) (.+)$/, 3];
    commands['~nunsub'].regex = [/^nunsub ([^ ]+)$/, 2];
    commands['~ununsub'].regex = [/^ununsub ([^ ]+)$/, 2];
    commands['~ustatus'].regex = [/^ustatus ([^ ]+)$/, 2];
    commands['~sustatus'].regex = [/^sustatus ([^ ]+)$/, 2];
    commands['~ustatus'].access = 'power_user';
    commands['~sustatus'].access = 'power_user';
    commands['~sustatus'].access = 'concerning';

    return commands;
};

exports.fetch = function(dbot) {
    return commands(dbot);
};
