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
                dbot.say(data.channel, params[1] + ' has been kicked ' + dbot.db.kicks[params[1]] + ' times and has kicked people ' + dbot.db.kickers[params[1]] + ' times.');
            }
        },

        '~kickstats': function(data, params) {
            var kickArr = [];
            for(var kickUser in dbot.db.kicks) {
                if(dbot.db.kicks.hasOwnProperty(kickUser)) {
                    kickArr.push([kickUser, dbot.db.kicks[kickUser]]);
                }
            }

            var orderedKicks = kickArr.sort(function(a, b) { return a[1] - b[1]; });
            var topKicks = kickArr.slice(kickArr.length - 5).reverse();
            var kickString = "Top Kicks: ";

            for(var i=0;i<topKicks.length;i++) {
                kickString += topKicks[i][0] + " (" + topKicks[i][1] + "), ";
            }
            kickString = kickString.slice(0, -2);

            dbot.say(data.channel, kickString);
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
