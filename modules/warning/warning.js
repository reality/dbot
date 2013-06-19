var _ = require('underscore')._;

var warning = function(dbot) {
    this.warnings = dbot.db.warnings;

    this.commands = {
        '~warn': function(event) {
            var warner = event.user,
                server = event.server,
                warnee = dbot.api.users.resolveUser(server, event.input[1]),
                reason = event.input[2],
                adminChannel = dbot.config.servers[server].admin_channel;

            // Store the warn
            if(!_.has(this.warnings, server)) this.warnings[server] = {};
            if(!_.has(this.warnings[server], warnee)) this.warnings[server][warnee] = [];

            this.warnings[server][warnee].push({
                'warner': warner,
                'reason': reason,
                'time': new Date().getTime()
            });

            // Notify interested parties
            var notifyString = dbot.t('warn_notify', {
                'warner': warner,
                'warnee': warnee,
                'reason': reason,
                'url': dbot.api.web.getUrl('warnings/' + server + '/' + warnee)
            });
            if(!_.isUndefined(adminChannel)) {
                adminChannel = event.channel.name; 
            }
            dbot.api.report.notify(server, adminChannel, notifyString);
            dbot.say(server, adminChannel, notifyString);
            dbot.say(server, warnee, notifyString);
        },

        '~warnings': function(event) {
            var warnee = event.params[1],
                server = event.server;

            if(_.has(this.warnings, server) && _.has(this.warnings[server], warnee)) {
                event.reply(dbot.t('warning_info', {
                    'user': warnee,
                    'num': this.warnings[server][warnee].length,
                    'url': dbot.api.web.getUrl('warnings/' + server + '/' + warnee)
                })); 
            } else {
                event.reply(dbot.t('no_warnings', { 'user': warnee }));
            }
        }
    };

    this.commands['~warn'].regex = [/~warn ([^ ]+) (.+)/, 3];
    this.commands['~warn'].access = 'moderator';
};

exports.fetch = function(dbot) {
    return new warning(dbot);
};
