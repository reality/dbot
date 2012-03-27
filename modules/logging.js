var logging = function(dbot) {
    var logMessage = function(message) {
        if(!(dbot.hasOwnProperty('log'))) {
            dbot['log'] = [];
        }
        dbot.log.push([Date.now(), message]);
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
            });
        },
        'on': ['JOIN', 'PART', 'KICK', 'PRIVMSG', 'MODE']
    };
};

exports.fetch = function(dbot) {
    return logging(dbot);
};
