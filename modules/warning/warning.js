var _ = require('underscore')._;
    uuid = require('node-uuid');

var warning = function(dbot) {
    this.api = {
        'warn': function(server, warner, user, reason, channel, callback) {
            var adminChannel = dbot.config.servers[server].admin_channel || channel.name;
            
            dbot.api.users.resolveUser(server, user, function(err, warnee) {
                if(warnee) {
                    var id = uuid.v4();
                    this.db.save('warnings', id, {
                        'id': id,
                        'server': server,
                        'warnee': warnee.id,
                        'warner': warner.id,
                        'reason': reason,
                        'time': new Date().getTime()
                    }, function(err) {
                        var notifyString = dbot.t('warn_notify', {
                            'warner': warner.primaryNick,
                            'warnee': warnee.primaryNick,
                            'reason': reason,
                            'url': dbot.api.web.getUrl('warning/' + server + '/'
                                + warnee.primaryNick)
                        });

                        dbot.api.report.notify('warn', server, warner, adminChannel, notifyString, false, warnee.primaryNick);
                        dbot.say(server, adminChannel, notifyString);

                        var uString = dbot.t('warn_user', {
                            'warner': warner.primaryNick,
                            'reason': reason,
                            'admin_channel': dbot.config.servers[server].admin_channel
                        });

                        if(reason.indexOf('#quiet') === -1 && reason.indexOf('#note') === -1) {
                            dbot.say(server, warnee.currentNick, uString);
			}

			dbot.api.event.emit('new_warning', [ warner, warnee, reason ]);

                        callback(null);
                    });
                } else {
                    callback(true);
                }
            }.bind(this));
        }
    };

    this.commands = {
        '~warn': function(event) {
            var warner = event.rUser,
                server = event.server,
                reason = event.input[2];

            this.api.warn(server, warner, event.input[1], reason, event.channel, function(err) {
                if(err) {
                    event.reply(dbot.t('warnee_not_found', { 'user': event.input[1] }));
                }
            });
        },

        '~rmwarning': function(event) {
          var user = event.params[1],
              index = parseInt(event.params[2]);

            dbot.api.users.resolveUser(event.server, user, function(err, warnee) {
              if(warnee) {
                var warns = {};

                dbot.api.users.getUserAliases(warnee.id, function(err, aliases) {
                  var alia = aliases.push(warnee.primaryNick);
                  this.db.search('notifies', { 
                    'server': event.server, 
                    'type': 'warn'
                  }, function(result) {
                    if(_.include(alia, result.target)) {
                      warns[result.time] = result;
                    }
                  }, function(err) {
                    var sTimes = _.keys(warns).sort(function(a, b) {
                      return parseInt(a) - parseInt(b);
                    });
                    event.reply(_.keys(sTimes));

                    if(index <= sTimes.length && index >= 0) {
                      this.db.del('notifies', warns[sTimes[index]], function(err) {
                        event.reply(dbot.t('warning_removed'));
                      });
                    } else {
                      event.reply(dbot.t('warning_not_found'));
                    }
                  }.bind(this));
                }.bind(this)); 
              }
            }.bind(this));
        },

        '~rmlastwarning': function(event) {
            var lastWarning = null;
            dbot.api.users.resolveUser(event.server, event.params[1], function(err, warnee) {
              this.db.search('warnings', { 'server': event.server, 'warnee': warnee.id }, function(warning) {
                if(!lastWarning || (lastWarning && lastWarning.time < warning.time)) {
                  lastWarning = warning;
                }
              }, function(err) {
                if(!lastWarning) {
                  event.reply('Looks like ' + event.params[1] + ' has no warnings.');
                } else {
                  this.db.del('warnings', lastWarning.id, function(err) {
                      event.reply(dbot.t('warning_removed') + ' - ' + lastWarning.reason);
                  });
                }
              }.bind(this));
            }.bind(this));
        },
        '~warnings': function(event) {
            var warnee = event.params[1],
                server = event.server;

            dbot.api.users.resolveUser(server, warnee, function(err, warnee) {
                if(warnee) {
			var warnings = 0;
			this.db.search('warnings', { 
			    'server': server,
			    'warnee': warnee.id
			}, function(warning) {
			    warnings++; 
			}, function(err) {
			    if(warnings > 0) {
				event.reply(dbot.t('warning_info', {
				    'user': warnee.primaryNick,
				    'num': warnings,
				    'url': dbot.api.web.getUrl('warning/' + server + '/'
					+ warnee.primaryNick)
				})); 
			    } else {
				event.reply(dbot.t('no_warnings', { 'user':
				    warnee.primaryNick }));
			    }
			});
		} else {
				event.reply(event.params[1] + ' not found.');
		}
            }.bind(this));
        }
    };

    this.commands['~warn'].regex = [/warn ([^ ]+) (.+)/, 3];
    this.commands['~warn'].access = 'power_user';
    this.commands['~rmwarning'].access = 'power_user';
    this.commands['~rmlastwarning'].access = 'power_user';
};

exports.fetch = function(dbot) {
    return new warning(dbot);
};
