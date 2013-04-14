var commands = function(dbot) {
    var commands = {
        /*** Kick Management ***/
        '~ckick': function(event) {
            var server = event.server,
                kicker = event.user,
                kickee = event.input[2],
                channel = event.input[1],
                reason = event.input[3];

            this.api.kick(server, kickee, channel, reason + ' (requested by ' + kicker + ')'); 
            dbot.api.report.notify(server, channel, kicker, kickee, dbot.t('ckicked', {
                'kicker': kicker,
                'kickee': kickee,
                'channel': channel,
                'reason': reason
            }));
        },

        /*** Kick Stats ***/

        // Give the number of times a given user has been kicked and has kicked
        // other people.
        '~kickcount': function(event) {
            var username = event.params[1];

            if(!_.has(dbot.db.kicks, username)) {
                var kicks = '0';
            } else {
                var kicks = dbot.db.kicks[username];
            }

            if(!_.has(dbot.db.kickers, username)) {
                var kicked = '0';
            } else {
                var kicked = dbot.db.kickers[username];
            }

            event.reply(dbot.t('user_kicks', {
                'user': username, 
                'kicks': kicks, 
                'kicked': kicked
            }));
        },

        // Output a list of the people who have been kicked the most and those
        // who have kicked other people the most.
        '~kickstats': function(event) {
            var orderedKickLeague = function(list, topWhat) {
                var kickArr = _.chain(list)
                    .pairs()
                    .sortBy(function(kick) { return kick[1] })
                    .reverse()
                    .first(10)
                    .value();

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

    commands['~ckick'].access = 'moderator';
    commands['~ckick'].regex = [/^~ckick ([^ ]+) ([^ ]+) (.+)$/, 4];

    return commands;
};

exports.fetch = function(dbot) {
    return commands(dbot);
};
