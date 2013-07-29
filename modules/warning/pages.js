var _ = require('underscore')._,
    async = require('async');

var pages = function(dbot) {
    this.warnings = dbot.db.warnings;

    return {
        '/warning': function(req, res) {
            res.render('servers', {  
                'name': dbot.config.name,
                'servers': _.keys(dbot.config.servers)
            });
        },

        '/warning/:server': function(req, res) {
            var server = req.params.server,
                userIds = [],
                userNicks = [];

            this.db.search('warnings', { 'server': server }, function(warning) {
                if(!_.include(userIds, warning.warnee)) userIds.push(warning.warnee);
            }, function(err) {
                async.eachSeries(userIds, function(id, callback) {
                    dbot.api.users.getUser(id, function(user) {
                        userNicks.push(user.primaryNick); 
                        callback(false);
                    });
                }, function(err) {
                    res.render('users', {
                        'name': dbot.config.name,
                        'server': server,
                        'users': userNicks
                    });
                });
            });
        },

        '/warning/:server/:uid': function(req, res) {
            var server = req.params.server,
                user = req.params.uid;

            dbot.api.users.resolveUser(server, user, function(user) {
                var warnings = [];
                this.db.search('warnings', {
                    'server': server,
                    'warnee': user.id
                }, function(warning) {
                    warnings.push(warning);
                }, function(err) {
                    async.eachSeries(warnings, function(warning, callback) {
                        dbot.api.users.getUser(warning.warner, function(user) {
                            warning.warner = user.primaryNick;
                            callback(false);
                        });
                    }, function(err) {
                        res.render('warnings', {
                            'name': dbot.config.name,
                            'server': server,
                            'warnings': warnings
                        });
                    });
                });
            }.bind(this));
        }
    };
};

exports.fetch = function(dbot) {
    return pages(dbot);
};
