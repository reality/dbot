var pages = function(dbot) {
    var _ = require('underscore')._;
    var connections = dbot.instance.connections;

    return {
        '/connections': function(req, res) {
            var connections = Object.keys(dbot.instance.connections);
            res.render('connections', { 'name': dbot.config.name, 'connections': connections });
        },

        '/channels/:connection': function(req, res) {
            var connection = req.params.connection;
            if(dbot.instance.connections.hasOwnProperty(connection)) {
                var channels = Object.keys(dbot.instance.connections[connection].channels);
                res.render('channels', { 'name': dbot.config.name, 'connection': connection, 'channels': channels});
            } else {
                res.render_core('error', { 'name': dbot.config.name, 'message': 'No such connection.' });
            }
        },

        '/users/:connection/:channel': function(req, res) {
            var connection = req.params.connection;
            var channel = _.unescape(req.params.channel);
            var connections = dbot.instance.connections;

            if(connections.hasOwnProperty(connection) && 
                connections[connection].channels.hasOwnProperty(channel)) {

                var userData = { "active": [], "inactive": [], "offline": []};
                
                var reply = dbot.api.stats.getChanUsersStats(connection, channel, [
                        "lines", "words", "lincent", "wpl", "in_mentions"
                ]);
                _.each(reply.users, function(user, userName){
                    if(userName != dbot.config.name){
                        if(user.online){
                            if(user.active){
                                userData.active.push(user);
                            }
                            else{
                                userData.inactive.push(user);
                            }
                        }
                        else{
                            userData.offline.push(user);
                        }
                    }
                });

                var userSort = function(a, b){
                    var x = a.display.toLowerCase();
                    var y = b.display.toLowerCase();
                    if(x > y) return 1;
                    if(x < y) return -1;
                    return 0;
                }
                userData.active.sort(userSort);
                userData.inactive.sort(userSort);
                userData.offline.sort(userSort);

                var userDataSorted = (userData.active.concat(userData.inactive)).concat(userData.offline);

                res.render('users', { 'name': dbot.config.name, 'connection': connection,
                    'channel': channel, 'nicks': userDataSorted });
            } else {
                res.render_core('error', { 'name': dbot.config.name, 'message': 'No such connection or channel.' });
            }
        },
     
        '/user/:connection/:channel/:user': function(req, res) {
            var connection = req.params.connection;
            var channel = '#' + req.params.channel;
            var user = dbot.cleanNick(req.params.user);

            var quoteCount = 'no';
            if(dbot.db.quoteArrs.hasOwnProperty(user)) {
                var quoteCount = dbot.db.quoteArrs[user].length;
            }

            if(dbot.config.moduleNames.include('kick')) {
                if(!dbot.db.kicks.hasOwnProperty(req.params.user)) {
                    var kicks = '0';
                } else {
                    var kicks = dbot.db.kicks[req.params.user];
                }

                if(!dbot.db.kickers.hasOwnProperty(req.params.user)) {
                    var kicked = '0';
                } else {
                    var kicked = dbot.db.kickers[req.params.user];
                }
            } else {
                var kicks = 'N/A';
                var kicked = 'N/A';
            }

            res.render('user', { 'name': dbot.config.name, 'user': req.params.user,
            'channel': channel, 'connection': connection, 'cleanUser': user, 
            'quotecount': quoteCount, 'kicks': kicks, 'kicked': kicked });
        }
    };
};

exports.fetch = function(dbot) {
    return pages(dbot);
};
