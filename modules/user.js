var userCommands = function(dbot) {
    var dbot = dbot;

    var commands = {
        '~kc': function(data, params) {
            dbot.say('aisbot', '.karma ' + data.message.split(' ')[1]);
            dbot.waitingForKarma = data.channel;
        },

        '~kickcount': function(data, params) {
            if(!dbot.db.kicks.hasOwnProperty(params[1])) {
                var kicks = '0';
            } else {
                var kicks = dbot.db.kicks[params[1]];
            }

            if(!dbot.db.kickers.hasOwnProperty(params[1])) {
                var kicked = '0';
            } else {
                var kicked = dbot.db.kickers[params[1]];
            }


            dbot.say(data.channel, params[1] + ' has been kicked ' + kicks + ' times and has kicked people ' + kicked + ' times.');
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
            var kickString = "Top Kicked: ";

            for(var i=0;i<topKicks.length;i++) {
                kickString += topKicks[i][0] + " (" + topKicks[i][1] + "), ";
            }
            kickString = kickString.slice(0, -2);

            dbot.say(data.channel, kickString);

            // code repetition bad
            var kickArr = [];
            for(var kickUser in dbot.db.kickers) {
                if(dbot.db.kickers.hasOwnProperty(kickUser)) {
                    kickArr.push([kickUser, dbot.db.kickers[kickUser]]);
                }
            }

            var orderedKicks = kickArr.sort(function(a, b) { return a[1] - b[1]; });
            var topKicks = kickArr.slice(kickArr.length - 5).reverse();
            var kickString = "Top Kickers: ";

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
