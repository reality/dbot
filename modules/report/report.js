var _ = require('underscore')._;

var report = function(dbot) {
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

            _.each(ops, function(user) {
                dbot.say(server, user.name, message);
            }, this);
        }
    };

    var commands = {
        '~report': function(event) {
            var channelName = event.input[1],
                nick = event.input[2];
                reason = event.input[3];

            dbot.api.users.resolveUser(event.server, nick, function(reportee) {
                if(_.has(event.allChannels, channelName)) {
                    if(reportee) {
                        this.api.notify(event.server, channelName, dbot.t('report', {
                            'reporter': event.user,
                            'reported': nick,
                            'channel': channelName,
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
                this.api.notify(event.server, channelName, dbot.t('notify', {
                    'channel': channelName,
                    'notifier': event.user,
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
