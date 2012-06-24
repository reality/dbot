var kick = function(dbot) {
    var dbot = dbot;
    
    var commands = {
        // Give the number of times a given user has been kicked and has kicked
        // other people.
        '~kickcount': function(event) {
            var username = event.params[1];

            if(!dbot.db.kicks.hasOwnProperty(username)) {
                var kicks = '0';
            } else {
                var kicks = dbot.db.kicks[username];
            }

            if(!dbot.db.kickers.hasOwnProperty(username)) {
                var kicked = '0';
            } else {
                var kicked = dbot.db.kickers[username];
            }

            event.reply(dbot.t('user_kicks', {'user': username, 'kicks': kicks, 'kicked': kicked}));
        },

        // Output a list of the people who have been kicked the most and those
        // who have kicked other people the most.
        '~kickstats': function(event) {
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

            event.reply(orderedKickLeague(dbot.db.kicks, 'Kicked'));
            event.reply(orderedKickLeague(dbot.db.kickers, 'Kickers'));
        }
    };

    return {
        'name': 'kick',
        'ignorable': false,
        'commands': commands,

        'listener': function(event) {
           if(event.kickee == dbot.name) {
                dbot.instance.join(event, event.channel);
                event.reply(dbot.t('kicked_dbot', {'botname': dbot.name}));
                dbot.db.kicks[dbot.name] += 1;
            } else {
                if(!dbot.db.kicks.hasOwnProperty(event.kickee)) {
                    dbot.db.kicks[event.kickee] = 1;
                } else {
                    dbot.db.kicks[event.kickee] += 1;
                }

                if(!dbot.db.kickers.hasOwnProperty(event.user)) {
                    dbot.db.kickers[event.user] = 1; 
                } else {
                    dbot.db.kickers[event.user] += 1;
                }

                event.reply(event.kickee + '-- (' + dbot.t('user_kicks', 
                    {'user': event.kickee, 'kicks': dbot.db.kicks[event.kickee], 'kicked': dbot.db.kickers[event.kickee]}) + ')');
            }
        },
        on: 'KICK'
    };
};

exports.fetch = function(dbot) {
    return kick(dbot);
};
