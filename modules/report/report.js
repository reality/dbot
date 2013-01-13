var _ = require('underscore')._;

var report = function(dbot) {
    var commands = {
        '~report': function(event) {
            var channelName = event.input[1];
            var nick = event.input[2];
            var reason = event.input[3];

            if(_.has(event.allChannels, channelName)) {
                var channel = event.allChannels[channelName];
                if(_.has(channel.nicks, nick)) {
                    var ops = _.filter(channel.nicks, function(user) {
                        return user.op; 
                    });

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

    return {
        'name': 'report',
        'ignorable': true,
        'commands': commands
    };
};

exports.fetch = function(dbot) {
    return report(dbot);
};
