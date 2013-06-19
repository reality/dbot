var _ = require('underscore')._;

var pages = function(dbot) {
    return {
        '/warnings': function(req, res) {
            res.render('warnings_servers', {  
                'name': dbot.config.name,
                'servers': _.keys(this.warnings)
            });
        },

        '/warnings/:server': function(req, res) {
            var server = req.params.server;

            if(_.has(this.warnings, server)) {
                res.render('warnings_users', {
                    'name': dbot.config.name,
                    'users': _.keys(this.warnings[server])
                });
            } else {
                res.render('error');
            }
        },

        '/warnings/:server/:user': function(req, res) {
            var server = req.params.server,
                user = req.params.user;

            if(_.has(this.warnings, server) && _.has(this.warnings.server, user)) {
                res.render('warnings', {
                    'name': dbot.config.name,
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
