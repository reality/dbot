/**
 * Name: Users
 * Description: Track known users
 */
var users = function(dbot) {
    var knownUsers = dbot.db.knownUsers;
    var getServerUsers = function(server) {
        if(!knownUsers.hasOwnProperty(server)) {
            knownUsers[server] = { 'users': [], 'aliases': {} };
        }
        return knownUsers[server];    
    };

    var updateAliases = function(event, oldUser, newUser) {
        var knownUsers = getServerUsers(event.server);
        for(var alias in knownUsers.aliases) {
            if(knownUsers.aliases.hasOwnProperty(alias)) {
                if(knownUsers.aliases[alias] === oldUser) {
                    knownUsers.aliases[alias] = newUser;
                }
            }
        }
    }

    dbot.instance.addListener('366', 'users', function(event) {
        var knownUsers = getServerUsers(event.server);
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

    var api = {
        'resolveUser': function(server, nick, useLowercase) {
            var knownUsers = getServerUsers(server); 
            var user = nick;
            if(!knownUsers.users.include(nick) && knownUsers.aliases.hasOwnProperty(nick)) {
                user = knownUsers.aliases[nick];
            }

            if(useLowercase) user = user.toLowerCase();
            return user;
        }
    };

    var commands = {
        '~alias': function(event) {
            var knownUsers = getServerUsers(event.server);
            var alias = event.params[1].trim();
            if(knownUsers.users.include(alias)) {
                var aliasCount = 0;
                knownUsers.aliases.each(function(primaryUser) {
                    if(primaryUser == alias) aliasCount += 1;
                }.bind(this));
                event.reply(dbot.t('primary', { 'user': alias, 'count': aliasCount })); 
            } else if(knownUsers.aliases.hasOwnProperty(alias)) {
                event.reply(dbot.t('alias', { 'alias': alias, 
                    'user': knownUsers.aliases[alias] }));
            } else {
                event.reply(dbot.t('unknown_alias', { 'alias': alias }));
            }
        },

        '~setaliasparent': function(event) {
            if(dbot.config.admins.include(event.user)) {
                var knownUsers = getServerUsers(event.server);
                var newParent = event.params[1];

                if(knownUsers.aliases.hasOwnProperty(newParent)) {
                    var newAlias = knownUsers.aliases[newParent]; 

                    // Replace users entry with new primary user
                    var usersIndex = knownUsers.users.indexOf(newAlias);
                    knownUsers.users.splice(usersIndex, 1);
                    knownUsers.users.push(newParent);

                    // Remove alias for new parent & add alias for new alias
                    delete knownUsers.aliases[newParent];
                    knownUsers.aliases[newAlias] = newParent;

                    // Update aliases to point to new primary user
                    updateAliases(event, newAlias, newParent);

                    event.reply(dbot.t('aliasparentset', { 'newParent': newParent, 
                        'newAlias': newAlias }));

                    dbot.api.stats.fixStats(event.server, newAlias);
                } else {
                    event.reply(dbot.t('unknown_alias', { 'alias': newParent}));
                }
            }
        },

        '~mergeusers': function(event) {
            if(dbot.config.admins.include(event.user)) {
                var knownUsers = getServerUsers(event.server);
                var primaryUser = event.params[1];
                var secondaryUser = event.params[2];

                if(knownUsers.users.include(primaryUser) && knownUsers.users.include(secondaryUser)) {
                    knownUsers.users.splice(knownUsers.users.indexOf(secondaryUser), 1);  
                    knownUsers.aliases[secondaryUser] = primaryUser;
                    updateAliases(event, secondaryUser, primaryUser);

                    event.reply(dbot.t('merged_users', { 
                        'old_user': secondaryUser,
                        'new_user': primaryUser
                    }));
                    
                    dbot.api.stats.fixStats(event.server, secondaryUser);
                } else {
                    event.reply(dbot.t('unprimary_error'));
                }
           } 
        }
    };

    return {
        'name': 'users',
        'ignorable': false,
        'commands': commands,
        'api': api,
        'pages': pages,
            
        'listener': function(event) {
            var knownUsers = getServerUsers(event.server); 
            if(event.action == 'JOIN') {
                if(!knownUsers.users.include(event.user)) {
                    knownUsers.users.push(event.user);
                }
            } else if(event.action == 'NICK') {
                var newNick = event.params.substr(1);
                if(knownUsers.aliases.hasOwnProperty(event.user)) {
                    knownUsers.aliases[newNick] = knownUsers.aliases[event.user];
                } else {
                    if(!knownUsers.users.include(newNick)) {
                        knownUsers.aliases[newNick] = event.user;
                    }
                }
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
