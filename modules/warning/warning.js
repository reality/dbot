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

                        dbot.api.report.notify('warn', server, warner, adminChannel, notifyString);
                        dbot.say(server, adminChannel, notifyString);

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
            var warning = null;
            dbot.api.users.resolveUser(event.server, event.input[1], function(err, warnee) {
                if(warnee) {
                    this.db.search('warnings', { 'warnee': warnee.id, 'reason': event.input[2] }, function(result) {
                        warning = result;
                    }, function(err) {
                        if(!err && warning) {
                            this.db.del('warnings', warning.id, function(err) {
                                event.reply(dbot.t('warning_removed'));
                            });
                        } else {
                            event.reply(dbot.t('warning_not_found'));
                        }
                    }.bind(this));
                } else {
                    event.reply(dbot.t('warning_not_found'));
                }
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
    this.commands['~rmwarning'].regex = [/^rmwarning ([\d\w\s\-]+?)[ ]?=[ ]?(.+)$/, 3];
    this.commands['~rmwarning'].access = 'power_user';
};

exports.fetch = function(dbot) {
    return new warning(dbot);
};
