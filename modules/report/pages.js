var _ = require('underscore')._;

var pages = function(dbot) {
    var pages = {
        '/notify': function(req, res) {
            res.render('servers', {  
                'name': dbot.config.name,
                'servers': _.keys(dbot.config.servers)
            });
        },

        '/notify/:server': function(req, res) {
            var server = req.params.server;
            res.render('channels', {
                'name': dbot.config.name,
                'server': server,
                'channels': _.keys(dbot.instance.connections[server].channels)
            });
        },

        '/notify/:server/missing': function(req, res) {
            var server = req.params.server,
                user = req.user,
                notifies = this.pending[user.id];

            res.render('missing_notifies', {
                'name': dbot.config.name,
                'user': user.primaryNick,
                'notifies': _.sortBy(notifies, 'time')
            });

            if(_.has(dbot.modules, 'log')) {
                dbot.api.log.log(server, user.primaryNick, 
                    'Checked their missing notifications.');
            }
        },

        '/notify/:server/:channel': function(req, res) {
            var server = req.params.server,
                channel = req.params.channel,
                notifies = [];

            this.db.search('notifies', {
                'server': server,
                'channel': channel
            }, function(notify) {
                notifies.push(notify);
            }, function(err) {
                res.render('notifies', {
                    'name': dbot.config.name,
                    'server': server,
                    'notifies': _.sortBy(notifies, 'time')
                });
            });
        }
    };

    return pages;
};

exports.fetch = function(dbot) {
    return pages(dbot);
};
