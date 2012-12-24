/**
 * Name: Users
 * Description: Track known users
 */
var users = function(dbot) {
    var knownUsers = dbot.db.knownUsers;
    var getServerUsers = function(event) {
        if(!knownUsers.hasOwnProperty(event.server)) {
            knownUsers[event.server] = { 'users': [], 'aliases': {} };
        }
        return knownUsers[event.server];    
    };

    dbot.instance.addListener('366', 'users', function(event) {
        var knownUsers = getServerUsers(event);
        for(var nick in event.channel.nicks) {
            if(!knownUsers.users.include(nick) && !knownUsers.aliases.hasOwnProperty(nick) &&
                    event.channel.nicks.hasOwnProperty(nick)) {
                knownUsers.users.push(nick);
            }
        }
    });

    var pages = {
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
                var nicks = Object.keys(connections[connection].channels[channel].nicks);
                res.render('users', { 'name': dbot.config.name, 'connection': connection,
                    'channel': channel, 'nicks': nicks });
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

            res.render('user', { 'name': dbot.config.name, 'user': req.params.user,
            'channel': channel, 'connection': connection, 'cleanUser': user, 
            'quotecount': quoteCount, 'kicks': kicks, 'kicked': kicked });
        },
    };

    return {
        'name': 'users',
        'ignorable': false,

        'commands': {
            '~alias': function(event) {
                var knownUsers = getServerUsers(event);
                var alias = event.params[1].trim();
                if(knownUsers.aliases.hasOwnProperty(alias)) {
                    event.reply(alias + ' is an alias of ' + knownUsers.aliases[alias]);
                } else {
                    event.reply(alias + ' is not known as an alias to me.');
                }
            }
        },

        'pages': pages,
            
        'listener': function(event) {
            var knownUsers = getServerUsers(event); 
            if(event.action == 'JOIN') {
                if(!knownUsers.users.include(event.user)) {
                    knownUsers.users.push(event.user);
                }
            } else if(event.action == 'NICK') {
                var newNick = event.params.substr(1);
                knownUsers.aliases[newNick] = event.user;
            }
        },
        'on': ['JOIN', 'NICK'],
        
        'onLoad': function() {
            // Trigger updateNickLists to stat current users in channel
            var connections = dbot.instance.connections;
            for(var conn in connections) {
                if(connections.hasOwnProperty(conn)) {
                    connections[conn].updateNickLists();
                }
            }
        }
    };
};

exports.fetch = function(dbot) {
    return users(dbot);
};
