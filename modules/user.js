// Commands that probably belong elsewhere.
var userCommands = function(dbot) {
    var dbot = dbot;

    var commands = {
        // Give a karma comment for a given user
        '~kc': function(data, params) {
            dbot.say('aisbot', '.karma ' + data.message.split(' ')[1]);
            dbot.waitingForKarma = data.channel;
        },

        // Give the number of times a given user has been kicked and has kicked
        // other people.
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

        // Output a list of the people who have been kicked the most and those
        // who have kicked other people the most.
        '~kickstats': function(data, params) {
            var orderedKickLeague = function(list, topWhat) {
                var kickArr = [];
                for(var kickUser in list) {
                    if(list.hasOwnProperty(kickUser)) {
                        kickArr.push([kickUser, list[kickUser]]);
                    }
                }

                kickArr = kickArr.sort(function(a, b) { return a[1] - b[1]; });
                kickArr = kickArr.slice(kickArr.length - 10).reverse();
                var kickString = "Top " + topWhat + ": ";

                for(var i=0;i<topKicks.length;i++) {
                    kickString += topKicks[i][0] + " (" + topKicks[i][1] + "), ";
                }

                return kickString.slice(0, -2);
            };

            dbot.say(data.channel, orderedKickLeague(dbot.db.kicks, 'Kicked'));
            dbot.say(data.channel, orderedKickLeague(dbot.db.kickers, 'Kickers'));
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
