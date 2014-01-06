var _ = require('underscore')._;

var commands = function(dbot) {
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
                        if(user && _.include(this.config.host_lookup, channelName)) {
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
    commands['~report'].regex = [/^report ([^ ]+) ([^ ]+) (.+)$/, 4];
    commands['~notify'].regex = [/^notify ([^ ]+) (.+)$/, 3];
    commands['~nunsub'].regex = [/^nunsub ([^ ]+)$/, 2];
    commands['~ununsub'].regex = [/^ununsub ([^ ]+)$/, 2];

    return commands;
};

exports.fetch = function(dbot) {
    return commands(dbot);
};
