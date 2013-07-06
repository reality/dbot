var _ = require('underscore')._;

var pages = function(dbot) {
    return {
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

        '/notify/:server/:user': function(req, res) {
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
                    'notifies': notifies 
                });
            });
        }
    };
};

exports.fetch = function(dbot) {
    return pages(dbot);
};
