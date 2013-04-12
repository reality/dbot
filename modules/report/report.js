var _ = require('underscore')._;

var report = function(dbot) {
    var commands = {
        '~report': function(event) {
            var channelName = event.input[1];
            var nick = event.input[2];
            var reason = event.input[3];

            if(_.has(event.allChannels, channelName)) {
                var channel = event.allChannels[channelName];
                if(dbot.api.users.isChannelUser(event.server, nick, channelName, true)) {
                    var nick = dbot.api.users.resolveUser(event.server, nick, true);
                    var ops = _.filter(channel.nicks, function(user) {
                        if(this.config.notifyVoice) {
                            return user.op || user.voice;
                        } else {
                            return user.op; 
                        }
                    }, this);

                    _.each(ops, function(user) {
                        dbot.say(event.server, user.name, dbot.t('report', {
                            'reporter': event.user,
                            'reported': nick,
                            'channel': channelName,
                            'reason': reason
                        }));
                    }, this);

                    event.reply(dbot.t('reported', { 'reported': nick }));
                } else {
                    event.reply(dbot.t('user_not_found', { 'reported': nick,
                        'channel': channelName }));
                }
            } else {
                event.reply(dbot.t('not_in_channel', { 'channel': channelName }));
            }
        }
    };
    commands['~report'].regex = [/^~report ([^ ]+) ([^ ]+) (.+)$/, 4];
    this.commands = commands;
};

exports.fetch = function(dbot) {
    return new report(dbot);
};
