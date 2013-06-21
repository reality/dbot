var _ = require('underscore')._;

var pages = function(dbot) {
    this.warnings = dbot.db.warnings;

    return {
        '/warning': function(req, res) {
            res.render('servers', {  
                'name': dbot.config.name,
                'servers': _.keys(this.warnings)
            });
        },

        '/warning/:server': function(req, res) {
            var server = req.params.server;

            if(_.has(this.warnings, server)) {
                res.render('users', {
                    'name': dbot.config.name,
                    'server': server,
                    'users': _.keys(this.warnings[server])
                });
            } else {
                res.render('error');
            }
        },

        '/warning/:server/:user': function(req, res) {
            var server = req.params.server,
                user = req.params.user;

            if(_.has(this.warnings, server) && _.has(this.warnings[server], user)) {
                res.render('warnings', {
                    'name': dbot.config.name,
                    'server': server,
                    'warnings': this.warnings[server][user]
                });
            } else {
                res.render('error');
            }
        }
    };
};

exports.fetch = function(dbot) {
    return pages(dbot);
};
