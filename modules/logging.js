var logging = function(dbot) {
    var logMessage = function(message, channel) {
        if(!(dbot.hasOwnProperty('log'))) {
            dbot['log'] = {};
        }

        if(channel) {
            channel = channel.toLowerCase();
        } else {
            channel = '@';  // it's a logger message, shouldn't go in any channel. hence, invalid channel name '@'
        }

        if(!(dbot.log.hasOwnProperty(channel))) {
            dbot.log[channel] = [];
        }
        dbot.log[channel].push([Date.now(), message]);
    };

    return {
        'onLoad': function() {
            logMessage({
                'type': 'LoggerEvent',
                'details': 'Logger loaded.'
            });

            return {};
        },

        'onDestroy': function() {
            logMessage({
                'type': 'LoggerEvent',
                'details': 'Logger unloaded.'
            });
        },

        'listener': function(data, eventType) {
            logMessage({
                'type': 'IRCEvent',
                'details': {
                    'eventType': eventType,
                    'data': data
                }
            }, data.channel);
        },
        'on': ['JOIN', 'PART', 'KICK', 'PRIVMSG', 'MODE']
    };
};

exports.fetch = function(dbot) {
    return logging(dbot);
};
