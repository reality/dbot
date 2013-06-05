var _ = require('underscore')._;

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

            dbot.api.report.notify(server, channel, dbot.t('ckicked', {
                'kicker': kicker,
                'kickee': kickee,
                'channel': channel,
                'reason': reason
            }));
        },

        '~cban': function(event) {
            var server = event.server,
                banner = event.user,
                banee = event.input[2],
                channel = event.input[1],
                reason = event.input[3];

            this.api.ban(server, banee, channel);
            this.api.kick(server, kickee, channel, reason + ' (requested by ' + banner + ')');

            dbot.api.report.notify(server, channel, dbot.t('cbanned', {
                'banner': banner,
                'banee': banee,
                'channel': channel,
                'reason': reason
            }));
        },

        // Kick and ban from all channels on the network.
        '~nban': function(event) {
            var server = event.server,
                banner = event.user,
                banee = event.input[1],
                reason = event.input[2],
                channels = dbot.config.servers[server].channels;

            var i = 0;
            var banChannel = function(channels) {
                if(i >= channels.length) return;
                var channel = channels[i];
                this.api.ban(server, banee, channel);
                this.api.kick(server, banee, channel, reason + 
                    ' (network-wide ban requested by ' + banner + ')');
                setTimeout(function() {
                    i++;  banChannel(channels);
                }, 1000);
            }.bind(this);
            banChannel(channels);

            var notifyString = dbot.t('nbanned', {
                'banner': banner,
                'banee': banee,
                'reason': reason
            });

            // TODO: When this is merged into database branch, have it use the
            //   api.quotes.addQuote function
            if(this.config.document_bans && _.has(dbot.modules, 'quotes')) {
                dbot.db.quoteArrs['ban_' + banee] = [ dbot.t('nban_quote', {
                    'banee': banee,
                    'banner': banner,
                    'time': new Date().toUTCString(),
                    'reason': reason
                }) ];
                
                notifyString += ' ' + dbot.t('quote_recorded', { 'user': banee });
            }

            var notifyChannel = event.channel.name;
            if(this.config.admin_channels[event.server]) {
                notifyChannel = this.config.admin_channels[event.server]; 
            }
            dbot.api.report.notify(server, notifyChannel, notifyString);
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

    _.each(commands, function(command) {
        command.access = 'moderator'; 
    });

    commands['~kickcount'].access = 'regular';
    commands['~kickstats'].access = 'regular';

    commands['~ckick'].regex = [/^~ckick ([^ ]+) ([^ ]+) (.+)$/, 4];
    commands['~nban'].regex = [/^~nban ([^ ]+) (.+)$/, 3];

    return commands;
};

exports.fetch = function(dbot) {
    return commands(dbot);
};
