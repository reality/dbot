var userCommands = function(dbot) {
    var dbot = dbot;

    var commands = {
        '~kc': function(data, params) {
            dbot.say('aisbot', '.karma ' + data.message.split(' ')[1]);
            dbot.waitingForKarma = data.channel;
        },

        '~kickcount': function(data, params) {
            if(!dbot.db.kicks.hasOwnProperty(params[1])) {
                dbot.say(data.channel, params[1] + ' has either never been kicked or does not exist.');
            } else {
                dbot.say(data.channel, params[1] + ' has been kicked ' + dbot.db.kicks[params[1]] + ' times.');
            }
        }
    };

    return {
        'onLoad': function() {
            return commands;
        }
    };
};

exports.fetch = function(dbot) {
    return userCommands(dbot);
};
