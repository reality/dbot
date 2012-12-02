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
                        dbot.say(event.server, ops[i], 
                            'Attention: ' + event.user + ' has reported ' +
                            nick + ' in ' + channelName + '. The reason ' +
                            'given was: "' + reason + '."');
                    }

                    event.reply('Thank you, ' + nick + ' has been reported the channel administrators.');
                } else {
                    event.reply('User is not in that channel.');
                }
            } else {
                event.reply('I am not in that channel.');
            }
        }

    };
    commands['~report'].regex = [/^~report ([^ ]+) ([^ ]+) (.+)$/, 4];
    commands['~report'].usage = '~report [#channel] [username] [reason for reporting]';

    return {
        'name': 'report',
        'ignorable': true,
        'commands': commands
    };
};

exports.fetch = function(dbot) {
    return report(dbot);
};
