var _ = require('underscore')._;

var commands = function(dbot) {
    var commands = {
        /*** Kick Management ***/

        '~quiet': function(event) {
            var server = event.server,
                quieter = event.user,
                channel = event.input[1],
                quietee = event.input[2].trim();

            if(_.isUndefined(channel)) {
                channel = event.channel.name;
            }
            channel = channel.trim();

            this.api.quiet(server, quietee, channel);
            event.reply(dbot.t('quieted', { 'quietee': quietee }));
        },

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
            if(!event.input) return;

            var server = event.server,
                banner = event.user,
                timeout = event.input[1],
                banee = event.input[2],
                reason = event.input[3],
                adminChannel = this.config.admin_channel[event.server];
                channels = dbot.config.servers[server].channels,
                network = event.server;

            if(this.config.network_name[event.server]) {
                network = this.config.network_name[event.server];
            }
            console.log(timeout);
            console.log(banee);
            console.log(reason);

            dbot.api.nickserv.getUserHost(event.server, banee, function(host) {
                // Add host record entry
                if(host) {
                    if(!_.has(this.hosts, event.server)) this.hosts[event.server] = {};
                    this.hosts[event.server][banee] = host;

                    // Create notify string
                    if(!_.isUndefined(timeout)) {
                        timeout = parseFloat(timeout.trim());
                        
                        var msTimeout = new Date(new Date().getTime() + (timeout * 3600000));
                        if(!_.has(this.tempBans, event.server)) this.tempBans[event.server] = {};
                        this.tempBans[event.server][banee] = msTimeout;
                        this.internalAPI.addTempBan(event.server, banee, msTimeout);

                        var notifyString = dbot.t('tbanned', {
                            'network': network,
                            'banner': banner,
                            'banee': banee,
                            'hours': timeout,
                            'reason': reason
                        });
                        var quoteString = dbot.t('tban_quote', {
                            'banee': banee,
                            'banner': banner,
                            'hours': timeout,
                            'time': new Date().toUTCString(),
                            'reason': reason
                        });
                    } else {
                        var notifyString = dbot.t('nbanned', {
                            'network': network,
                            'banner': banner,
                            'banee': banee,
                            'reason': reason
                        });
                        var quoteString = dbot.t('nban_quote', {
                            'banee': banee,
                            'banner': banner,
                            'time': new Date().toUTCString(),
                            'reason': reason
                        });
                    }

                    // Add qutoe category documenting ban
                    if(this.config.document_bans && _.has(dbot.modules, 'quotes')) {
                        dbot.db.quoteArrs['ban_' + banee.toLowerCase()] = [ quoteString ];
                        notifyString += ' ' + dbot.t('quote_recorded', { 'user': banee });
                    }

                    // Notify moderators, banee
                    if(this.config.admin_channel[event.server]) {
                        channels = _.without(channels, adminChannel);

                        dbot.api.report.notify(server, adminChannel, notifyString);
                        dbot.say(event.server, adminChannel, notifyString);

                        if(!_.isUndefined(timeout)) {
                            dbot.say(event.server, banee, dbot.t('tbanned_notify', {
                                'network': network,
                                'banner': banner,
                                'reason': reason,
                                'hours': timeout,
                                'admin_channel': adminChannel 
                            }));
                        } else {
                            dbot.say(event.server, banee, dbot.t('nbanned_notify', {
                                'network': network,
                                'banner': banner,
                                'reason': reason,
                                'hours': timeout,
                                'admin_channel': adminChannel 
                            }));
                        }
                    }

                    // Ban the user from all channels
                    var i = 0;
                    var banChannel = function(channels) {
                        if(i >= channels.length) return;
                        var channel = channels[i];
                        this.api.ban(server, banee, channel);
                        this.api.kick(server, banee, channel, reason + 
                            ' (network-wide ban requested by ' + banner + ')');
                        setTimeout(function() {
                            i++; banChannel(channels);
                        }, 1000);
                    }.bind(this);
                    banChannel(channels);
                } else {
                    event.reply(dbot.t('no_user', { 'user': banee }));
                }
            }.bind(this));
        },

        '~nunban': function(event) {
            var unbanee = event.params[1],
                unbanner = event.user;

            this.api.networkUnban(event.server, unbanee, unbanner, function(err) {
                if(err) {
                    event.reply(dbot.t('nunban_error', { 'unbanee': unbanee })); 
                }
            });
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
    commands['~nban'].regex = /^~nban ([\d\.^ ]+)?([^ ]+) (.+)$/;
    commands['~quiet'].regex = /^~quiet (#[^ ]+ )?([^ ]+) ?$/;

    return commands;
};

exports.fetch = function(dbot) {
    return commands(dbot);
};
