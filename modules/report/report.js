var report = function(dbot) {
    var commands = {
        '~report': function(event) {
            var channelName = event.input[1];
            var nick = event.input[2];
            var reason = event.input[3];

            if(event.allChannels.hasOwnProperty(channelName)) {
                var channel = event.allChannels[channelName];
                if(channel.nicks.hasOwnProperty(nick)) {
                    var ops = [];
                    for(var possibOps in channel.nicks) {
                        if(channel.nicks[possibOps].op == true) {
                            ops.push(possibOps);
                        }
                    }

                    // Does the channel have an admin channel?
                    if(event.allChannels.hasOwnProperty('#' + channelName)) {
                        ops.push('#' + channelName);
                    }

                    for(var i=0;i<ops.length;i++) {
                        dbot.say(event.server, ops[i], dbot.t('report', {
                            'reporter': event.user,
                            'reported': nick,
                            'channel': channelName,
                            'reason': reason
                        }));
                    }

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
