var _ = require('underscore')._;

var pages = function(dbot) {
    return {
        '/bans': function(req, res) {
            res.render('servers', {
                'servers': _.keys(dbot.config.servers)
            });
        },

        '/bans/:server': function(req, res) {
            var server = req.params.server,
                bans = [];

            this.db.search('nbans', { 'server': server }, function(ban) {
                bans.push(ban);
            }, function() {
                res.render('bans', {
                    'server': server,
                    'bans': bans
                });
            });
        }
    }
};

exports.fetch = function(dbot) {
    return pages(dbot);
};
