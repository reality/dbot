var _ = require('underscore')._,
uuid = require('node-uuid');

var commands = function (dbot) {
  var commands = {
    /*** Kick Management ***/
    '~quiet': function (event) {
      var server = event.server,
      quieter = event.rUser,
      duration = event.input[1],
      channel = (event.input[2] || event.channel.name).trim(),
      quietee = event.input[3].trim(),
      reason = event.input[4] || "N/A";

      this.api.quietUser(server, quieter, duration, channel, quietee, reason, function (response) {
        event.reply(response);
      });
    },

    '~timeout': function (event) {
      var server = event.server,
      quieter = event.rUser,
      duration = this.config.timeoutTime,
      channel = event.channel.name,
      quietee = event.input[1],
      reason = event.input[2] || "N/A";

      reason += ' #timeout';

      dbot.api.users.resolveUser(server, quietee, function (err, user) {
        if (!err && user) {
          if (!_.has(this.recentTimeouts, user.id)) {
            this.recentTimeouts[user.id] = 0;
          }

          this.recentTimeouts[user.id] += 1;
          setTimeout(function () {
            this.recentTimeouts[user.id] -= 1;
            if (this.recentTimeouts[user.id] == 0) {
              delete this.recentTimeouts[user.id];
            }
          }
            .bind(this), 3600000);

          if (this.recentTimeouts[user.id] == 3) {
            duration = null;
            reason += ' #permatimeout';
            dbot.say(event.server, dbot.config.servers[event.server].admin_channel, quietee + ' has been given three timeouts in the last hour, and so has been quieted indefinitely in ' + channel + '. Please review.');
          }

          this.api.quietUser(server, quieter, duration, channel, quietee, reason, function (response) {
            event.reply(response);
          });
        }
      }
        .bind(this));
    },

    '~unquiet': function (event) {
      var server = event.server,
      quieter = event.user,
      channel = (event.input[1] || event.channel.name).trim(),
      quietee = event.input[2].trim();

      if (_.has(this.hosts[server], quietee)) {
        if (_.include(this.config.quietBans, channel)) {
          this.api.unban(server, this.hosts[server][quietee], channel);
        } else {
          this.api.unquiet(server, this.hosts[server][quietee], channel);
        }
        event.reply(dbot.t('unquieted', {
            'quietee': quietee
          }));
        dbot.api.report.notify('unquiet', server, event.rUser, channel,
          dbot.t('unquiet_notify', {
            'unquieter': quieter,
            'quietee': quietee
          }), false, quietee);
      }
    },

    '~ckick': function (event) {
      var server = event.server,
      kicker = event.user,
      kickee = event.input[2],
      channel = event.input[1],
      reason = event.input[3];

      if (_.isUndefined(channel)) {
        channel = event.channel.name;
      }
      channel = channel.trim();

      this.api.kick(server, kickee, channel, reason + ' (requested by ' + kicker + ')');

      dbot.api.report.notify('kick', server, event.rUser, channel, dbot.t('ckicked', {
          'kicker': kicker,
          'kickee': kickee,
          'reason': reason
        }), false, kickee);
    },

    // Kick and ban from all channels on the network.
    '~nban': function (event) {
      if (!event.input)
        return;

      var server = event.server,
      banner = event.user,
      timeout = event.input[1],
      banee = event.input[2],
      reason = event.input[3],
      adminChannel = dbot.config.servers[server].admin_channel,
      channels = _.keys(dbot.instance.connections[server].channels),
      network = event.server;

      if (this.config.network_name[event.server]) {
        network = this.config.network_name[event.server];
      }

      dbot.api.nickserv.getUserHost(event.server, banee, function (host) {
        // Add host record entry
        if (host) {
          var didKill = false;
          
          if ((reason.match('#line') || reason.match('#specialk') || reason.match('#kline')) && _.include(dbot.access.moderator(), event.rUser.primaryNick)) {
            didKill = true;
            var t = ' !P ';
            if (timeout) {
              t = ' !T ' + (timeout * 60);
            }
            dbot.say(event.server, 'operserv', 'akill add ' + banee + t + banee + ' banned by ' + banner + ': ' + reason);
          }

          // Do not ban if user was killed - redundant
          if(!didKill) {
            // Ban from current channel first
            this.api.ban(server, host, event.channel);
            this.api.kick(server, banee, event.channel, reason +
              ' (network-wide ban)');
            channels = _.without(channels, event.channel);
            if (!_.isUndefined(adminChannel)) {
              channels = _.without(channels, adminChannel);
            } else {
              adminChannel = event.channel.name;
            }

            // Ban the user from all channels
            var i = 0;
            var banChannel = function (channels) {
              if (i >= channels.length)
                return;
              var channel = channels[i];
              this.api.ban(server, host, channel);
              this.api.kick(server, banee, channel, reason +
                ' (network-wide ban)');
              i++;
              banChannel(channels);
            }
            .bind(this);
            banChannel(channels);
          }

          this.hosts[event.server][banee] = host;

          // Create notify string
          if (!_.isUndefined(timeout)) {
            timeout = timeout.trim();

            var msTimeout = new Date(new Date().getTime() + (parseFloat(timeout) * 3600000));
            if (_.has(dbot.modules, 'remind')) {
              msTimeout = dbot.api.remind.parseTime(timeout);
              if (!msTimeout) {
                return event.reply('Invalid time. Remember you must give e.g. 5m now.');
              }
              timeout = timeout.replace(/([\d]+)d/, '$1 days').replace(/([\d]+)h/, '$1 hours ').replace(/([\d]+)m/, '$1 minutes ').replace(/([\d]+)s/, '$1 seconds').trim();
            } else {
              timeout += ' hours';
            }

            // Do not schedule unbans if the user was killed as no ban was put in place
            if(!didKill) {
              if (!_.has(this.tempBans, event.server))
                this.tempBans[event.server] = {};
              this.tempBans[event.server][banee] = msTimeout;
              this.internalAPI.addTempBan(event.server, banee, msTimeout);
            }

            var notifyString = dbot.t('tbanned', {
                'network': network,
                'banner': banner,
                'banee': banee,
                'hours': timeout,
                'host': host,
                'reason': reason
              });
          } else {
            var notifyString = dbot.t('nbanned', {
                'network': network,
                'banner': banner,
                'banee': banee,
                'host': host,
                'reason': reason
              });
          }

          // Add db entry documenting ban
          if (this.config.document_bans) {
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
            this.db.save('nbans', id, banRecord, function () {});
          }

          // Notify moderators, banee
          if (!_.isUndefined(adminChannel)) {
            channels = _.without(channels, adminChannel);
          } else {
            adminChannel = event.channel.name;
          }

          dbot.api.report.notify('ban', server, event.rUser, adminChannel, notifyString, false, banee);
          dbot.say(event.server, adminChannel, notifyString);

          if (!_.isUndefined(timeout)) {
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
        } else {
          event.reply(dbot.t('no_user', {
              'user': banee
            }));
        }
      }
        .bind(this));
    },

    '~nunban': function (event) {
      var unbanee = event.params[1],
      host = event.params[2] || undefined,
      unbanner = event.rUser;

      this.api.networkUnban(event.server, unbanee, unbanner, host, function (err) {
        if (err) {
          event.reply(dbot.t('nunban_error', {
              'unbanee': unbanee
            }));
        }
      });
    },

    /*** Kick Stats ***/

    // Give the number of times a given user has been kicked and has kicked
    // other people.
    '~kickcount': function (event) {
      var username = event.params[1];

      if (!_.has(dbot.db.kicks, username)) {
        var kicks = '0';
      } else {
        var kicks = dbot.db.kicks[username];
      }

      if (!_.has(dbot.db.kickers, username)) {
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
    '~kickstats': function (event) {
      var orderedKickLeague = function (list, topWhat) {
        var kickArr = _.chain(list)
          .pairs()
          .sortBy(function (kick) {
            return kick[1]
          })
          .reverse()
          .first(10)
          .value();

        var kickString = "Top " + topWhat + ": ";
        for (var i = 0; i < kickArr.length; i++) {
          kickString += kickArr[i][0] + " (" + kickArr[i][1] + "), ";
        }

        return kickString.slice(0, -2);
      };

      event.reply(orderedKickLeague(dbot.db.kicks, 'Kicked'));
      event.reply(orderedKickLeague(dbot.db.kickers, 'Kickers'));
    },

    '~votequiet': function (event) {
      var target = event.input[1],
      reason = event.input[2];

      if (_.has(event.channel.nicks, target)) {
        dbot.api.users.resolveUser(event.server, target, function (err, user) {
          if (!err && user) {
            if (_.include(dbot.access.power_user(), user.primaryNick) || target == dbot.config.name) {
              return event.reply('User is immune to votequiet.');
            }

            if (!_.has(this.voteQuiets, user.id)) {
              this.voteQuiets[user.id] = {
                'user': user.id,
                'reason': reason,
                'channel': event.channel,
                'yes': [event.rUser.primaryNick],
                'no': []
              };
              event.reply(event.user + ' has started a vote to quiet ' + target + ' for "' + reason + '." Type either "~voteyes ' + target + '" or "~voteno ' + target + '" in the next 90 seconds.');

              this.voteQuiets[user.id].timer = setTimeout(function () {
                  var vq = this.voteQuiets[user.id];
                  vq.spent = true;
                  if (vq.yes.length >= 3 && vq.no.length < 2) {
                    event.reply('Attempt to quiet ' + target + ' succeeded. Count: Yes (' + vq.yes.length + '). No (' + vq.no.length + ').');

                    this.api.quietUser(event.server, event.rUser, '10m', event.channel, target, reason + '[votequiet]', function (response) {
                      clearTimeout(vq.timer);
                      event.reply(response);
                    });
                  } else {
                    event.reply('Attempt to quiet ' + target + ' failed. Count: Yes (' + vq.yes.length + '). No (' + vq.no.length + ').');
                  }

                  var nString = 'A votequiet was attempted on ' + target + ' in ' + event.channel + '. It was initiated by ' + event.rUser.primaryNick + '. ' +
                    vq.yes.join(', ') + ' voted yes (' + vq.yes.length + '). ';
                  if (vq.no.length > 0) {
                    nString += vq.no.join(', ') + ' voted no (' + vq.no.length + ').'
                  }

                  dbot.api.report.notify('votequiet', event.server, event.rUser, event.channel, nString, false, target);

                  setTimeout(function () {
                    delete this.voteQuiets[user.id];
                  }
                    .bind(this), 600000);
                }
                  .bind(this), 90000);
            } else {
              if (this.voteQuiets[user.id].spent) {
                event.reply('A votequiet attempt has already been made on this user in the last 10 minutes.');
              } else {
                var vq = this.voteQuiets[user.id]
                  if (!_.include(vq.yes, event.rUser.primaryNick)) {
                    vq.yes.push(event.rUser.primaryNick);

                    event.reply('There is already a votequiet attempt active for this user, adding yes vote to existing poll.');
                    event.reply('Voted yes on votequiet for ' + target + '. New count: Yes (' + vq.yes.length + '). No (' + vq.no.length + ').');

                    if (vq.yes.length == 4) {
                      event.reply('Attempt to quiet ' + target + ' succeeded. Count: Yes (' + vq.yes.length + '). No (' + vq.no.length + ').');
                      this.api.quietUser(event.server, event.rUser, '10m', event.channel, target, reason + '[votequiet]', function (response) {
                        clearTimeout(vq.timer);
                        vq.spent = true;
                        setTimeout(function () {
                          delete this.voteQuiets[user.id];
                        }
                          .bind(this), 600000);
                        event.reply(response);
                      });
                    }
                  } else {
                    event.reply('There is already a votequiet attempt active for this user, and you already voted yes!');
                  }
              }
            }
          } else {
            event.reply('Target does not seem to be in the channel.');
          }
        }
          .bind(this));
      } else {
        event.reply('Target does not seem to be in the channel.');
      }
    },

    '~voteyes': function (event) {
      var target = event.params[1];

      dbot.api.users.resolveUser(event.server, target, function (err, user) {
        if (!err && user) {
          if (user.id == event.rUser.id) {
            return event.reply('You cannot vote on your own silencing. Be good.');
          }
          if (_.has(this.voteQuiets, user.id) && !this.voteQuiets[user.id].spent) {
            var vq = this.voteQuiets[user.id];
            if (event.channel != vq.channel) {
              return event.reply('Vote must be in ' + vq.channel);
            }
            if (!_.include(vq.yes, event.rUser.primaryNick) && !_.include(vq.no, event.rUser.primaryNick)) {
              vq.yes.push(event.rUser.primaryNick);
              event.reply('Voted yes on votequiet for ' + target + '. New count: Yes (' + vq.yes.length + '). No (' + vq.no.length + ').');

              if (vq.yes.length == 4) {
                event.reply('Attempt to quiet ' + target + ' succeeded. Count: Yes (' + vq.yes.length + '). No (' + vq.no.length + ').');
                this.api.quietUser(event.server, event.rUser, '10m', event.channel, target, vq.reason + '[votequiet]', function (response) {
                  clearTimeout(vq.timer);
                  vq.spent = true;
                  setTimeout(function () {
                    delete this.voteQuiets[user.id];
                  }
                    .bind(this), 600000);
                  event.reply(response);
                });
              }
            } else {
              event.reply('You have already voted.');
            }
          } else {
            event.reply('There is no active votequiet for this user. You can start one by typing "~votequiet ' + target + ' [reason].');
          }
        } else {
          event.reply('No idea who that is m8');
        }
      }
        .bind(this));
    },

    '~voteno': function (event) {
      var target = event.params[1];

      dbot.api.users.resolveUser(event.server, target, function (err, user) {
        if (!err && user) {
          if (user.id == event.rUser.id) {
            return event.reply('You cannot vote on your own silencing. Be good.');
          }
          if (_.has(this.voteQuiets, user.id) && !this.voteQuiets[user.id].spent) {
            var vq = this.voteQuiets[user.id];
            if (event.channel != vq.channel) {
              return event.reply('Vote must be in ' + vq.channel);
            }
            if (!_.include(vq.yes, event.rUser.primaryNick) && !_.include(vq.no, event.rUser.primaryNick)) {
              vq.no.push(event.rUser.primaryNick);
              event.reply('Voted no on votequiet for ' + target + '. New count: Yes (' + vq.yes.length + '). No (' + vq.no.length + ').');
            } else {
              event.reply('You have already voted.');
            }
          } else {
            event.reply('There is no active votequiet for this user. You can start one by typing "~votequiet ' + target + ' [reason].');
          }
        } else {
          event.reply('No idea who that is m8');
        }
      }
        .bind(this));
    }
  };

  _.each(commands, function (command) {
    command.access = 'moderator';
  });

  commands['~kickcount'].access = 'regular';
  commands['~kickstats'].access = 'regular';
  commands['~votequiet'].access = 'regular';
  commands['~voteyes'].access = 'regular';
  commands['~voteno'].access = 'regular';
  commands['~quiet'].access = 'voice';
  commands['~timeout'].access = 'voice';
  commands['~unquiet'].access = 'voice';
  commands['~nban'].access = 'power_user';
  commands['~nunban'].access = 'power_user';

  commands['~ckick'].regex = /^ckick (#[^ ]+ )?([^ ]+) ?(.*)?$/;
  commands['~nban'].regex = /^nban (\d[\d\.dhmsy]+)? ?([^ ]+) (.+)$/;
  commands['~quiet'].regex = /^quiet (\d[\d\.hmsy]+)? ?(#[^ ]+ )?([^ ]+) ?(.*)?$/;
  commands['~timeout'].regex = /^timeout ([^ ]+) ?(.*)?$/;
  commands['~unquiet'].regex = /^unquiet (#[^ ]+ )?([^ ]+) ?$/;
  commands['~votequiet'].regex = [/^votequiet ([^ ]+) (.+)$/, 3];

  return commands;
};

exports.fetch = function (dbot) {
  return commands(dbot);
};
