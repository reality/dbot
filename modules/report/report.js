var _ = require('underscore')._,
    uuid = require('node-uuid'),
    async = require('async');

var report = function(dbot) {
    if(!dbot.db.pending) dbot.db.pending = {};
    if(!dbot.db.pNotify) dbot.db.pNotify = {};
    this.pending = dbot.db.pending;
    this.pNotify = dbot.db.pNotify;

    this.internalAPI = {
        'notify': function(server, users, message) {
            async.eachSeries(users, function(nick, next) {
                setTimeout(function() {
                    dbot.say(server, nick, message);
                    next();
                }, 1000);
            });
        },

        'formatNotify': function(type, server, user, channel, message) {
            var notifier = '[' + user.primaryNick + ']';

            if(_.has(this.config.colours, server)) {
                var colours = this.config.colours[server];

                notifier = '[' + colours['nicks'] + user.primaryNick + '\u000f]';
                if(_.has(colours.type, type)) {
                    type = colours['type'][type] + type + '\u000f';
                }
                if(_.has(colours['channels'], channel)) {
                    channel = colours['channels'][channel] +
                        channel + "\u000f";
                }

                _.each(message.match(/ @([\d\w*|-]+)/g), function(u) {
                    u = u.substr(1);
                    message = message.replace(u, colours['nicks'] + u + "\u000f");
                    notifier += '[' + colours['nicks'] + u.substr(1) + '\u000f]';
                });
            }

            return dbot.t('notify', {
                'type': type,
                'channel': channel,
                'notifier': notifier,
                'message': message
            });
        }.bind(this)
    };

    this.api = {
        'notify': function(type, server, user, cName, message) {
            var id = uuid.v4();
            this.db.save('notifies', id, {
                'id': id,
                'server': server,
                'type': type,
                'channel': cName,
                'user': user.id,
                'time': new Date().getTime(),
                'message': message
            }, function() {});

            var channel = dbot.instance.connections[server].channels[cName]; 
            var ops = _.filter(channel.nicks, function(user) {
                if(this.config.notifyVoice) {
                    return user.op || user.voice;
                } else {
                    return user.op; 
                }
            }, this);
            ops = _.pluck(ops, 'name');

            dbot.api.users.resolveChannel(server, cName, function(channel) {
                if(channel) {
                    var perOps = channel.op;
                    if(this.config.notifyVoice) perOps = _.union(perOps, channel.voice);

                    this.db.read('nunsubs', channel.id, function(err, nunsubs) {
                        async.eachSeries(ops, function(nick, next) {
                            dbot.api.users.resolveUser(server, nick, function(user) {
                                if(!_.include(user.mobile, user.currentNick)) {
                                    perOps = _.without(perOps, user.id);
                                }
                                if(nunsubs && _.include(nunsubs.users, user.id)) {
                                    ops = _.without(ops, user.currentNick);
                                }
                                next();
                            }); 
                        }, function() {
                            offlineUsers = perOps;
                            if(!_.include(this.config.noMissingChans, cName)) {
                                _.each(offlineUsers, function(id) {
                                    if(!this.pending[id]) this.pending[id] = [];
                                    this.pending[id].push({
                                        'time': new Date().getTime(),
                                        'channel': cName,
                                        'user': user.primaryNick,
                                        'message': message
                                    });
                                    this.pNotify[id] = true;
                                }.bind(this));
                            }
                            
                            message = this.internalAPI.formatNotify(type, server,
                                user, cName, message);
                            this.internalAPI.notify(server, ops, message);
                            if(_.has(this.config.chan_redirs, cName)) {
                                dbot.say(server, this.config.chan_redirs[cName], message);
                            }
                        }.bind(this)); 
                    }.bind(this));
                }
            }.bind(this));
        }, 

        'notifyUsers': function(server, users, message) {
            this.internalAPI.notify(server, users, message);
        }
    };

    this.listener = function(event) {
        if(_.has(this.pending, event.rUser.id) && this.pNotify[event.rUser.id] === true && !_.include(event.rUser.mobile, event.rUser.currentNick)) {
            dbot.say(event.server, event.user, dbot.t('missed_notifies', {
                'user': event.rUser.primaryNick,
                'link': dbot.api.web.getUrl('notify/missing')
            }));
            this.pNotify[event.rUser.id] = false;
        }
    }.bind(this);
    this.on = 'JOIN';

    var commands = {
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
            var channelName = event.input[1],
                nick = event.input[2],
                reason = event.input[3].trim();

            if(reason.charAt(reason.length - 1) != '.') reason += '.';

            dbot.api.users.resolveUser(event.server, nick, function(reportee) {
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
                    dbot.api.users.resolveUser(event.server, first, function(user) {
                        if(user) {
                            dbot.api.nickserv.getUserHost(event.server, first, function(host) {
                                message = message.replace(first, first + ' [' + host + ']'); 
                                this.api.notify('notify', event.server, event.rUser, channelName, message);
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
            var cName = event.input[1];
            
            dbot.api.users.resolveChannel(event.server, cName, function(channel) {
                if(channel) {
                    this.db.read('nunsubs', channel.id, function(err, nunsubs) {
                        if(!nunsubs) {
                            var nunsubs = {
                                'id': channel.id,
                                'users': []
                            }
                        } 

                        if(!_.include(nunsubs, event.rUser.id)) {
                            nunsubs.users.push(event.rUser.id); 
                            this.db.save('nunsubs', channel.id, nunsubs, function() {
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
            }.bind(this));
        },
        
        '~ununsub': function(event) {
            var cName = event.input[1];

            dbot.api.users.resolveChannel(event.server, cName, function(channel) {
                if(channel) {
                    this.db.read('nunsubs', channel.id, function(err, nunsubs) {
                        if(!_.isUndefined(nunsubs) && _.include(nunsubs.users, event.rUser.id)) {
                            nunsubs.users = _.without(nunsubs.users, event.rUser.id);
                            this.db.save('nunsubs', channel.id, nunsubs, function() {
                                event.reply(dbot.t('ununsubbed', { 'cName': cName }));
                            });
                        } else {
                            event.reply(dbot.t('not_nunsubbed', { 'cName': cName }));
                        }
                    }.bind(this));
                } else {
                    event.reply('Channel not known.');
                }
            }.bind(this));
        }
    };
    commands['~report'].regex = [/^~report ([^ ]+) ([^ ]+) (.+)$/, 4];
    commands['~notify'].regex = [/^~notify ([^ ]+) (.+)$/, 3];
    commands['~nunsub'].regex = [/^~nunsub ([^ ]+)$/, 2];
    commands['~ununsub'].regex = [/^~ununsub ([^ ]+)$/, 2];
    this.commands = commands;

    this.onLoad = function() {
        if(_.has(dbot.modules, 'web')) {
            dbot.api.web.addIndexLink('/notify', 'Notifications');
        }

        dbot.api.event.addHook('~mergeusers', function(server, oldUser, newUser) {
            this.db.search('notifies', { 'user': oldUser.id }, function(notify) {
                notify.user = newUser.id;
                this.db.save('notifies', notify.id, notify, function() {}); 
            }.bind(this), function() {}); 
        }.bind(this));

        dbot.api.event.addHook('new_current_nick', function(user) {
            if(_.has(this.pending, user.id) && this.pNotify[user.id] === true 
                    && !_.include(user.mobile, user.currentNick)) {
                dbot.say(user.server, user.currentNick, dbot.t('missed_notifies', {
                    'user': user.primaryNick,
                    'link': dbot.api.web.getUrl('notify/missing')
                }));
                this.pNotify[user.id] = false;
            }

        }.bind(this));

        
    }.bind(this);
};

exports.fetch = function(dbot) {
    return new report(dbot);
};
