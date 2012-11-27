var report = function(dbot) {
    var commands = {
        '~report': function(event) {
            var channelName = event.input[1];
            var nick = event.input[2];
            var reason = event.input[3];

            if(dbot.instance.connections[event.server].channels.hasOwnProperty(channelName)) {
                var channel = dbot.instance.connections[event.server].channels[channelName];
                if(channel.nicks.hasOwnProperty(nick)) {
                    var ops = [];
                    for(var possibOps in channel.nicks) {
                        if(channel.nicks[possibOps].op == true) {
                            ops.push(possibOps);
                        }
                    }

                    for(var i=0;i<ops.length;i++) {
                        dbot.say(event.server, ops[i], 
                            'Attention: ' + event.user + ' has reported ' +
                            nick + ' in ' + channelName + '. The reason ' +
                            'given was: "' + reason + '."');
                    }

                    if(dbot.instance.connections[event.server].channels.hasOwnProperty('#'+
                        channelName)) {
                        var adminChannel = '#' + channelName;
                        dbot.say(event.server, adminChannel, 
                            'Attention: ' + event.user + ' has reported ' +
                            nick + ' in ' + channelName + '. The reason ' +
                            'given was: "' + reason + '."');
                    }

                    event.reply('Thank you, ' + nick + ' has been reported the channel administrators.');
                } else {
                    event.reply('Nick is not in channel.');
                }
            } else {
                event.reply('Channel does not exist.');
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
