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
                dbot.say(server, nick, message);
                setTimeout(function() {
                    next();
                }, 1000);
            });
        }
    };

    this.api = {
        'notify': function(server, channel, message) {
            var channel = dbot.instance.connections[server].channels[channel]; 
            var ops = _.filter(channel.nicks, function(user) {
                if(this.config.notifyVoice) {
                    return user.op || user.voice;
                } else {
                    return user.op; 
                }
            }, this);

            dbot.api.users.resolveChannel(server, channel, function(channel) {
                if(channel) {
                    var perOps = channel.op;
                    if(this.config.notifyVoice) pOps = _.union(perOps, channel.voice);

                    async.eachSeries(ops, function(nick, next) {
                        dbot.api.users.resolveUser(server, nick, function(user) {
                            perOps = _.without(perOps, user.id); next();
                        }); 
                    }, function() {
                        offlineUsers = perOps;
                        _.each(offlineUsers, function(id) {
                            if(!this.pending[id]) this.pending[id] = [];
                            this.pending[id].push({
                                'time': new Date().getTime(),
                                'message': message
                            });
                            this.pNotify[id] = true;
                        }.bind(this));

                        this.internalAPI.notify(server, _.pluck(ops, 'name'), message);
                    }.bind(this)); 
                }
            }.bind(this));
        }, 

        'notifyUsers': function(server, users, message) {
            this.internalAPI.notify(server, users, message);
        }
    };

    this.listener = function(event) {
        if(_.has(this.pending, event.rUser.id) && this.pNotify[event.rUser.id] === true) {
            dbot.say(event.server, event.user, dbot.t('missed_notifies', {
                'user': event.rUser.primaryNick,
                'link': dbot.api.web.getUrl('report/' + event.server + '/missing')
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
                        var notifier = '[' + event.user + ']',
                            cChan = channelName,
                            type = 'report',
                            reporter = event.user;
                        if(_.has(this.config.colours, event.server)) {
                            var colours = this.config.colours[event.server];

                            reporter = colours['nicks'] + reporter + '\u000f';
                            nick = colours['nicks'] + nick + '\u000f';
                            type = colours['type'][type] + type + '\u000f';
                            if(_.has(colours['channels'], channelName)) {
                                cChan = colours['channels'][channelName] +
                                    cChan + "\u000f";
                            }
                        }

                        this.api.notify(event.server, channelName, dbot.t('report', {
                            'type': type,
                            'reporter': reporter,
                            'reported': nick,
                            'channel': cChan,
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
                var id = uuid.v4();
                this.db.save('notifies', id, {
                    'id': id,
                    'server': event.server,
                    'channel': channelName,
                    'user': event.user,
                    'time': new Date().getTime(),
                    'message': message
                }, function() {});

                var notifier = '[' + event.user + ']',
                    cChan = channelName,
                    type = 'notify';
                if(_.has(this.config.colours, event.server)) {
                    var colours = this.config.colours[event.server];

                    notifier = '[' + colours['nicks'] + event.user + '\u000f]';
                    type = colours['type'][type] + type + '\u000f';
                    if(_.has(colours['channels'], channelName)) {
                        cChan = colours['channels'][channelName] +
                            cChan + "\u000f";
                    }

                    _.each(message.match(/@([\d\w\s*|-]+?)( |$|,|\.)/g), function(user) {
                        user = user.replace(/@([\d\w\s*|-]+?)( |$|,|\.)/, "$1");
                        notifier += '[' + colours['nicks'] + user + '\u000f]';
                    });
                    message = message.replace(/@([\d\w\s*|-]+?)( |$|,|\.)/g, colours['nicks'] +
                        "@$1\u000f$2");
                }
                    
                this.api.notify(event.server, channelName, dbot.t('notify', {
                    'type': type,
                    'channel': cChan,
                    'notifier': notifier,
                    'message': message
                }));

                event.reply(dbot.t('notified', {
                    'user': event.user,
                    'channel': channelName
                }));
            } else {
                event.reply(dbot.t('not_in_channel', { 'channel': channelName }));
            }
        }
    };
    commands['~report'].regex = [/^~report ([^ ]+) ([^ ]+) (.+)$/, 4];
    commands['~notify'].regex = [/^~notify ([^ ]+) (.+)$/, 3];
    this.commands = commands;
};

exports.fetch = function(dbot) {
    return new report(dbot);
};
