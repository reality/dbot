var _ = require('underscore')._;

var kick = function(dbot) {   
    if(!_.has(dbot.db, 'recentTimeouts')) {
      dbot.db.recentTimeouts = {};
    }
    this.recentTimeouts = dbot.db.recentTimeouts;

    this.api = {
        'ban': function(server, host, channel) {
            dbot.instance.connections[server].send('MODE ' + channel + ' +b *!*@' + host);
        },

        'quiet': function(server, host, channel) {
            dbot.instance.connections[server].send('MODE ' + channel + ' +q *!*@' + host);
        },

        'unquiet': function(server, host, channel) {
            dbot.instance.connections[server].send('MODE ' + channel + ' -q *!*@' + host);
        },

        'devoice': function(server, nick, channel) {
            dbot.instance.connections[server].send('MODE ' + channel + ' -v ' +nick);
        },

        'voice': function(server, nick, channel) {
            dbot.instance.connections[server].send('MODE ' + channel + ' +v ' +nick);
        },

        'kick': function(server, user, channel, msg) {
            dbot.instance.connections[server].send('KICK ' + channel + ' ' + user + ' :' + msg);
        },

        'unban': function(server, host, channel) {
            // TODO: Wrest control from chanserv
            //dbot.say(server, this.config.chanserv, 'unban ' + channel + ' *!*@' + host);
            dbot.instance.connections[server].send('MODE ' + channel + ' -b *!*@' + host);
        },

        'quietUser': function(server, quieter, duration, channel, quietee, reason, callback) {
            dbot.api.nickserv.getUserHost(server, quietee, function(host) {
                // Add host record entry
                if(host) {
                    this.hosts[server][quietee] = host;

                    if(!_.isUndefined(duration) && !_.isNull(duration)) {
                        duration = duration.trim();
                        var msTimeout = new Date(new Date().getTime() + (parseFloat(duration) * 60000));
                        if(_.has(dbot.modules, 'remind')) {
                          msTimeout = dbot.api.remind.parseTime(duration); 
                          if(!msTimeout) {
                            return callback('Invalid time. Remember you must give e.g. 5m now.');
                          }
                          duration = duration.replace(/([\d]+)d/, '$1 days').replace(/([\d]+)h/, '$1 hours ').replace(/([\d]+)m/, '$1 minutes ').replace(/([\d]+)s/, '$1 seconds').trim();
                        } else {
                          duration += ' minutes';
                        }

                        var vStatus = dbot.instance.connections[server].channels[channel].nicks[quietee].voice;
                        dbot.api.timers.addTimeout(msTimeout, function() {
                            if(_.has(this.hosts[server], quietee)) {
                                if(_.include(this.config.quietBans, channel)) {
                                  this.api.unban(server, this.hosts[server][quietee], channel);
                                  this.api.voice(server, quietee, channel);
                                } else {
                                    this.api.unquiet(server, this.hosts[server][quietee], channel);
                                }

                                dbot.api.users.resolveUser(server, dbot.config.name, function(err, user) {
                                    dbot.api.report.notify('unquiet', server, user, channel,
                                    dbot.t('unquiet_notify', {
                                        'unquieter': dbot.config.name,
                                        'quietee': quietee
                                    }), false, quietee);
                                });
                            }
                        }.bind(this));  
                        callback(dbot.t('tquieted', { 
                            'quietee': quietee,
                            'minutes': duration
                        }));
                        dbot.api.report.notify('quiet', server, quieter, channel,
                            dbot.t('tquiet_notify', {
                                'minutes': duration,
                                'quieter': quieter.primaryNick,
                                'quietee': quietee,
                                'reason': reason
                            }), false, quietee
                        );
                    } else {
                        callback(dbot.t('quieted', { 'quietee': quietee }));
                        dbot.api.report.notify('quiet', server, quieter, channel,
                        dbot.t('quiet_notify', {
                            'quieter': quieter,
                            'quietee': quietee,
                            'reason': reason
                        }), false, quietee);            
                    }

                    this.api.devoice(server, quietee, channel);

                    if(_.include(this.config.quietBans, channel)) {
                        this.api.ban(server, this.hosts[server][quietee], channel);
                    } else {
                        this.api.quiet(server, host, channel);
                    }

                    if(reason.indexOf('#warn') !== -1) {
                        dbot.api.warning.warn(server, quieter, quietee, 
                            'Quieted in ' + channel + ' for ' + reason, channel,
                            function() {});
                    }
                } else {
                    event.reply(dbot.t('no_user', { 'user': quietee }));
                }
            }.bind(this));
        },

        'networkUnban': function(server, unbanee, unbanner, callback) {
            var channels = dbot.config.servers[server].channels,
                network = this.config.network_name[server] || server,
                adminChannel = dbot.config.servers[server].admin_channel;

            if(_.has(this.hosts, server) && _.has(this.hosts[server], unbanee)) {
                var host = this.hosts[server][unbanee];

                // Notify Staff
                if(_.isUndefined(adminChannel)) {
                    adminChannel = event.channel.name;
                }

                var notifyString = dbot.t('nunbanned', {
                    'network': network,
                    'unbanee': unbanee,
                    'unbanner': unbanner.currentNick
                });
                dbot.api.report.notify('unban', server, unbanner, adminChannel, notifyString, false, unbanee);
                dbot.say(server, adminChannel, notifyString);

                // Notify Unbanee
                dbot.say(server, unbanee, dbot.t('nunban_notify', {
                    'network': network,
                    'unbanee': unbanee,
                    'unbanner': unbanner.currentNick
                }));

                // Unban
                var i = 0;
                var unbanChannel = function(channels) {
                    if(i >= channels.length) return;
                    var channel = channels[i];
                    this.api.unban(server, host, channel);
                    setTimeout(function() {
                        i++; unbanChannel(channels);
                    }, 1000);
                }.bind(this);
                unbanChannel(channels);

                dbot.say(server, 'NickServ', 'FREEZE ' + unbanee + ' OFF');
                callback(null); // Success
            } else {
                // Attempt to look up the host on-the-fly
                dbot.api.nickserv.getUserHost(server, unbanee, unbanner, function(host) {
                    if(host) {
                        if(!_.has(this.hosts, server)) this.hosts[server] = {};
                        this.hosts[server][unbanee] = host;
                        this.api.networkUnban(server, unbanee, unbanner);
                    } else {
                        callback(true); // No host could be found
                    }
                }.bind(this));
            }
        }
    };

    this.internalAPI = {
      'addTempBan': function(server, banee, timeout) {
        dbot.api.users.resolveUser(server, dbot.config.name, function(err, bot) {
          dbot.api.timers.addTimeout(timeout, function() {
            this.api.networkUnban(server, banee, bot, function(err) {});
            delete this.tempBans[server][banee];
          }.bind(this));
        }.bind(this));
      }.bind(this)
    };
    
    this.listener = function(event) {
       if(event.kickee == dbot.config.name) {
            dbot.instance.join(event, event.channel.name);
            event.reply(dbot.t('kicked_dbot', { 'botname': dbot.config.name }));
            dbot.db.kicks[dbot.config.name] += 1;
        } else {
            if(!_.has(dbot.db.kicks, event.kickee)) {
                dbot.db.kicks[event.kickee] = 1;
            } else {
                dbot.db.kicks[event.kickee] += 1;
            }

            if(!_.has(dbot.db.kickers, event.user)) {
                dbot.db.kickers[event.user] = 1; 
            } else {
                dbot.db.kickers[event.user] += 1;
            }

            if(!this.config.countSilently) {
                event.reply(event.kickee + '-- (' + dbot.t('user_kicks', {
                    'user': event.kickee, 
                    'kicks': dbot.db.kicks[event.kickee], 
                    'kicked': dbot.db.kickers[event.kickee]
                }) + ')');
            }
        }
    }.bind(this);
    this.on = 'KICK';

    this.onLoad = function() {
        if(!_.has(dbot.db, 'hosts')) {
            dbot.db.hosts = {};
            _.each(dbot.config.servers, function(v, k) {
                dbot.db.hosts[k] = {};
            }, this);
        }
        if(!_.has(dbot.db, 'tempBans')) dbot.db.tempBans = {};
        this.hosts = dbot.db.hosts;
        this.tempBans = dbot.db.tempBans;
        this.voteQuiets = {};
        
        _.each(this.tempBans, function(bans, server) {
            _.each(bans, function(timeout, nick) {
                timeout = new Date(timeout);
                this.internalAPI.addTempBan(server, nick, timeout); 
            }, this);
        }, this);

        if(_.has(dbot.modules, 'web')) {
            dbot.api.web.addIndexLink('/bans', 'Ban List');
        }
    }.bind(this);
};

exports.fetch = function(dbot) {
    return new kick(dbot);
};
