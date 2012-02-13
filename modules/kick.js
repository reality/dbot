var kick = function(dbot) {
    var dbot = dbot;
    
    var commands = {
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

                for(var i=0;i<kickArr.length;i++) {
                    kickString += kickArr[i][0] + " (" + kickArr[i][1] + "), ";
                }

                return kickString.slice(0, -2);
            };

            dbot.say(data.channel, orderedKickLeague(dbot.db.kicks, 'Kicked'));
            dbot.say(data.channel, orderedKickLeague(dbot.db.kickers, 'Kickers'));
        }
    };

    return {
        // Counts kicks
        'listener': function(data) {
           if(data.kickee == dbot.name) {
                dbot.instance.join(data.channel);
                dbot.say(data.channel, 'Thou shalt not kick ' + dbot.name);
                dbot.db.kicks[dbot.name] += 1;
            } else {

                if(dbot.db.modehate.include(data.user)) {
                    dbot.instance.send('KICK ' + data.channel + ' ' + data.user + ' :gtfo (MODEHATE)');

                    if(!dbot.db.kicks.hasOwnProperty(data.user)) {
                        dbot.db.kicks[data.user] = 1;
                    } else {
                        dbot.db.kicks[data.user] += 1;
                    }
                }

                if(!dbot.db.kicks.hasOwnProperty(data.kickee)) {
                    dbot.db.kicks[data.kickee] = 1;
                } else {
                    dbot.db.kicks[data.kickee] += 1;
                }

                if(!dbot.db.kickers.hasOwnProperty(data.user)) {
                    dbot.db.kickers[data.user] = 1; 
                } else {
                    dbot.db.kickers[data.user] += 1;
                }

                dbot.say(data.channel, data.kickee + '-- (' + data.kickee + ' has been kicked ' + dbot.db.kicks[data.kickee] + ' times)');
            }
        },

        on: 'KICK',
        
        'onLoad': function() {
            return commands;
        }

    };
};

exports.fetch = function(dbot) {
    return kick(dbot);
};
