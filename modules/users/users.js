/**
 * Name: Users
 * Description: Track known users
 */
var web = require('./web');

var users = function(dbot) {
    var knownUsers = dbot.db.knownUsers;
    var getServerUsers = function(server) {
        if(!knownUsers.hasOwnProperty(server)) {
            knownUsers[server] = { 'users': [], 'aliases': {}, 'channelUsers': {} };
        }
        if(!knownUsers[server].hasOwnProperty('channelUsers')) {
            knownUsers[server].channelUsers = {};
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

    var updateChannels = function(event, oldUser, newUser) {
        var channelUsers = getServerUsers(event.server).channelUsers;
        channelUsers.each(function(channel) {
            if(channel.include(oldUser)) {
                channel.splice(channel.indexOf(oldUser), 1);
                channel.push(newUser);
            }
        }.bind(this));
    }

    dbot.instance.addListener('366', 'users', function(event) {
        var knownUsers = getServerUsers(event.server);
        if(!knownUsers.channelUsers.hasOwnProperty(event.channel.name)) {
            knownUsers.channelUsers[event.channel.name] = [];
        }
        var channelUsers = knownUsers.channelUsers[event.channel.name];

        event.channel.nicks.each(function(nick) {
            nick = nick.name;
            if(api.isKnownUser(event.server, nick)) {
                nick = api.resolveUser(event.server, nick);
            } else {
                knownUsers.users.push(nick);
            }
            if(!channelUsers.include(nick)) {
                channelUsers.push(nick);
            }
        }.bind(this));
    });


    var api = {
        'resolveUser': function(server, nick, useLowercase) {
            var knownUsers = getServerUsers(server); 
            var user = nick;
            if(!knownUsers.users.include(nick) && knownUsers.aliases.hasOwnProperty(nick)) {
                user = knownUsers.aliases[nick];
            }

            if(useLowercase) user = user.toLowerCase();
            return user;
        },

        'isKnownUser': function(server, nick) {
            var knownUsers = getServerUsers(server); 
            return (knownUsers.users.include(nick) || knownUsers.aliases.hasOwnProperty(nick));
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

                    // Replace channels entries with new primary user
                    updateChannels(event, newAlias, newParent);

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
                    updateChannels(event, secondaryUser, primaryUser);

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
        'pages': web.getPages(dbot),
            
        'listener': function(event) {
            var knownUsers = getServerUsers(event.server); 
            var nick = event.user;

            if(event.action == 'JOIN') {
                if(!knownUsers.channelUsers.hasOwnProperty(event.channel.name)) {
                    knownUsers.channelUsers[event.channel.name] = [];
                }
                var channelUsers = knownUsers.channelUsers[event.channel.name];

                if(api.isKnownUser(event.server, nick)) {
                    nick = api.resolveUser(event.server, nick);
                } else {
                    knownUsers.users.push(nick);
                }
                if(!channelUsers.include(nick)) {
                    channelUsers.push(nick);
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
