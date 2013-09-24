var _ = require('underscore')._;
    uuid = require('node-uuid');

var warning = function(dbot) {
    this.commands = {
        '~warn': function(event) {
            var warner = event.rUser,
                server = event.server,
                reason = event.input[2],
                adminChannel = dbot.config.servers[server].admin_channel || event.channel.name;

            dbot.api.users.resolveUser(server, event.input[1], function(warnee) {
                if(warnee) {
                    var id = uuid.v4();
                    this.db.save('warnings', id, {
                        'id': id,
                        'server': event.server,
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

                        dbot.api.report.notify('warn', event.server, event.rUser, adminChannel, notifyString);
                        dbot.say(server, adminChannel, notifyString);
                    });
                } else {
                    event.reply(dbot.t('warnee_not_found', { 'user': event.input[1] }));
                }
            }.bind(this));
        },

        '~warnings': function(event) {
            var warnee = event.params[1],
                server = event.server;

            dbot.api.users.resolveUser(server, warnee, function(warnee) {
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
            }.bind(this));
        }
    };

    this.commands['~warn'].regex = [/~warn ([^ ]+) (.+)/, 3];
    this.commands['~warn'].access = 'power_user';
};

exports.fetch = function(dbot) {
    return new warning(dbot);
};
