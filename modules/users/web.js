var pages = function(dbot) {
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
            var channel = '#' + req.params.channel;
            var connections = dbot.instance.connections;

            if(connections.hasOwnProperty(connection) && 
                connections[connection].channels.hasOwnProperty(channel)) {

                var channelUsers = dbot.db.knownUsers[connection].channelUsers[channel];
                var usersData = {};
                for(var i=0;i<channelUsers.length;i++) {
                    usersData[channelUsers[i]] = { 
                        'name': channelUsers[i], 
                        'online': false, 
                        'active': false 
                    }; 
                }

                var onlineNicks = connections[connection].channels[channel].nicks;
                onlineNicks.each(function(nick) {
                    var user = dbot.api.users.resolveUser(connection, nick); 
                    if(onlineNicks.hasOwnProperty(nick)) {
                        usersData[user].online = true;
                    }
                    /*usersData[nick].active = dbot.api.stats.isActive({
                        'server': connection,
                        'user': nick,
                        'channel': channel
                    });*/
                }.bind(this));

                res.render('users', { 'name': dbot.config.name, 'connection': connection,
                    'channel': channel, 'nicks': usersData });
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

exports.getPages = function(dbot) {
    return pages(dbot);
};
