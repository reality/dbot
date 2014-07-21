var _ = require('underscore')._,
    uuid = require('node-uuid');

var commands = function(dbot) {
    var commands = {
        /*** Kick Management ***/
        '~quiet': function(event) {
            var server = event.server,
                quieter = event.user,
                minutes = event.input[1],
                channel = (event.input[2] || event.channel.name).trim(),
                quietee = event.input[3].trim(),
                reason = event.input[4] || "N/A";

            dbot.api.nickserv.getUserHost(server, quietee, function(host) {
                // Add host record entry
                if(host) {
                    this.hosts[server][quietee] = host;

                    if(!_.isUndefined(minutes)) {
                        minutes = parseFloat(minutes.trim());
                        var msTimeout = new Date(new Date().getTime() + (minutes * 60000));
                        dbot.api.timers.addTimeout(msTimeout, function() {
                            if(_.has(this.hosts[server], quietee)) {
                                this.api.unquiet(server, this.hosts[server][quietee], channel);

                                dbot.api.users.resolveUser(server, dbot.config.name, function(user) {
                                    dbot.api.report.notify('unquiet', server, user, channel,
                                    dbot.t('unquiet_notify', {
                                        'unquieter': dbot.config.name,
                                        'quietee': quietee
                                    }));
                                });
                            }
                        }.bind(this));  
                        event.reply(dbot.t('tquieted', { 
                            'quietee': quietee,
                            'minutes': minutes
                        }));
                        dbot.api.report.notify('quiet', server, event.rUser, channel,
                            dbot.t('tquiet_notify', {
                                'minutes': minutes,
                                'quieter': event.rUser.primaryNick,
                                'quietee': quietee,
                                'reason': reason
                            })
                        );
                    } else {
                        event.reply(dbot.t('quieted', { 'quietee': quietee }));
                        dbot.api.report.notify('quiet', server, event.rUser, channel,
                        dbot.t('quiet_notify', {
                            'quieter': quieter,
                            'quietee': quietee,
                            'reason': reason
                        }));            
                    }

                    this.api.quiet(server, host, channel);

                    if(reason.indexOf('#warn') !== -1) {
                        dbot.api.warning.warn(server, event.rUser, quietee, 
                            'Quieted in ' + channel + ' for ' + reason, channel,
                            function() {});
                    }
                } else {
                    event.reply(dbot.t('no_user', { 'user': quietee }));
                }
            }.bind(this));
        },

        '~unquiet': function(event) {
            var server = event.server,
                quieter = event.user,
                channel = (event.input[1] || event.channel.name).trim(),
                quietee = event.input[2].trim();

            if(_.has(this.hosts[server], quietee)) {
                this.api.unquiet(server, this.hosts[server][quietee], channel);
                event.reply(dbot.t('unquieted', { 'quietee': quietee }));
                dbot.api.report.notify('unquiet', server, event.rUser, channel,
                dbot.t('unquiet_notify', {
                    'unquieter': quieter,
                    'quietee': quietee
                }));
            }
        },

        '~ckick': function(event) {
            var server = event.server,
                kicker = event.user,
                kickee = event.input[2],
                channel = event.input[1],
                reason = event.input[3];

            if(_.isUndefined(channel)) {
                channel = event.channel.name;
            }
            channel = channel.trim();

            this.api.kick(server, kickee, channel, reason + ' (requested by ' + kicker + ')'); 

            dbot.api.report.notify('kick', server, event.rUser, channel, dbot.t('ckicked', {
                'kicker': kicker,
                'kickee': kickee,
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
                adminChannel = dbot.config.servers[server].admin_channel,
                channels = _.keys(dbot.instance.connections[server].channels),
                network = event.server;

            if(this.config.network_name[event.server]) {
                network = this.config.network_name[event.server];
            }

            dbot.api.nickserv.getUserHost(event.server, banee, function(host) {
                // Add host record entry
                if(host) {
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
                    } else {
                        var notifyString = dbot.t('nbanned', {
                            'network': network,
                            'banner': banner,
                            'banee': banee,
                            'reason': reason
                        });
                    }

                    // Add qutoe category documenting ban
                    if(this.config.document_bans) {
                        var id = uuid.v4();
                        var banRecord = {
                            'id': id,
                            'time': new Date().getTime(),
                            'server': server,
                            'banee': banee,
                            'banner': banner,
                            'host': host,
                            'reason': reason
                        };
                        this.db.save('nbans', id, banRecord, function() {});
                    }

                    // Notify moderators, banee
                    if(!_.isUndefined(adminChannel)) {
                        channels = _.without(channels, adminChannel);
                    } else {
                        adminChannel = event.channel.name;
                    }

                    dbot.api.report.notify('ban', server, event.rUser, adminChannel, notifyString);
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
                    
                    // err
                    dbot.say(event.server, 'NickServ', 'FREEZE ' + banee + ' ON ' + reason);

                    // Ban the user from all channels
                    var i = 0;
                    var banChannel = function(channels) {
                        if(i >= channels.length) return;
                        var channel = channels[i];
                        this.api.ban(server, host, channel);
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
                unbanner = event.rUser;

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
    commands['~quiet'].access = 'voice';
    commands['~unquiet'].access = 'voice';

    commands['~ckick'].regex = /^ckick (#[^ ]+ )?([^ ]+) ?(.*)?$/;
    commands['~nban'].regex = /^nban ([\d\.^ ]+)?([^ ]+) (.+)$/;
    commands['~quiet'].regex = /^quiet ([\d\.^ ]+)?(#[^ ]+ )?([^ ]+) ?(.*)?$/;
    commands['~unquiet'].regex = /^unquiet (#[^ ]+ )?([^ ]+) ?$/;

    return commands;
};

exports.fetch = function(dbot) {
    return commands(dbot);
};
