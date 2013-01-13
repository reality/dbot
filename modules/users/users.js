/**
 * Name: Users
 * Description: Track known users
 */
var web = require('./web'),
    _ = require('underscore')._;

var users = function(dbot) {
    var knownUsers = dbot.db.knownUsers;
    var getServerUsers = function(server) {
        if(!_.has(knownUsers, server)) {
            knownUsers[server] = { 'users': [], 'aliases': {}, 'channelUsers': {} };
        }
        if(!_.has(knownUsers[server], 'channelUsers')) {
            knownUsers[server].channelUsers = {};
        }
        return knownUsers[server];    
    };

    var updateAliases = function(event, oldUser, newUser) {
        var knownUsers = getServerUsers(event.server);
        _.each(knownUsers.aliases, function(user, alias) {
            if(user == oldUser) {
                knownUsers.aliases[alias] = newUser;
            }
        }, this);
    };

    var updateChannels = function(event, oldUser, newUser) {
        var channelUsers = getServerUsers(event.server).channelUsers;
        channelUsers = _.each(channelUsers, function(channel, channelName) {
            channelUsers[channelName] = _.without(channel, oldUser);
            channelUsers[channelName].push(newUser);
        }, this);
    };

    dbot.instance.addListener('366', 'users', function(event) {
        var knownUsers = getServerUsers(event.server);
        if(!_.has(knownUsers.channelUsers, event.channel.name)) {
            knownUsers.channelUsers[event.channel.name] = [];
        }
        var channelUsers = knownUsers.channelUsers[event.channel.name];

        _.each(event.channel.nicks, function(nick) {
            nick = nick.name;
            if(api.isKnownUser(event.server, nick)) {
                nick = api.resolveUser(event.server, nick);
            } else {
                knownUsers.users.push(nick);
            }
            if(!_.include(channelUsers, nick)) {
                channelUsers.push(nick);
            }
        }, this);
    });


    var api = {
        'resolveUser': function(server, nick, useLowercase) {
            var knownUsers = getServerUsers(server); 
            var user = nick;
            if(!_.include(knownUsers.users, nick) && _.has(knownUsers.aliases, nick)) {
                user = knownUsers.aliases[nick];
            }

            if(useLowercase) user = user.toLowerCase();
            return user;
        },

        'isKnownUser': function(server, nick) {
            var knownUsers = getServerUsers(server); 
            return (_.include(knownUsers.users, nick) || _.has(knownUsers.aliases, nick));
        },

        'isPrimaryUser': function(server, nick) {
            return _.include(knownUsers.users, nick);
        }

        'getAliases': function(server, nick) {
            var knownUsers = getServerUsers(server);
            return _.chain(knownUsers.aliases)
                .keys()
                .filter(function(user) {
                    return knownUsers.aliases[user] == nick;
                }, this)
                .value();
        }
    };

    var commands = {
        '~alias': function(event) {
            var knownUsers = getServerUsers(event.server),
                alias = event.params[1].trim();

            if(_.include(knownUsers.users, alias)) {
                var aliasCount = _.reduce(knownUsers.aliases, function(memo, user) {
                    if(user == alias) return memo += 1; 
                }, 0, this);

                event.reply(dbot.t('primary', { 
                    'user': alias, 
                    'count': aliasCount 
                })); 
            } else if(_.has(knownUsers.aliases, alias)) {
                event.reply(dbot.t('alias', { 
                    'alias': alias, 
                    'user': knownUsers.aliases[alias] 
                }));
            } else {
                event.reply(dbot.t('unknown_alias', { 'alias': alias }));
            }
        },

        '~setaliasparent': function(event) {
            var knownUsers = getServerUsers(event.server);
            var newParent = event.params[1];

            if(_.has(knownUsers.aliases, newParent)) {
                var newAlias = knownUsers.aliases[newParent]; 

                // Replace user entry
                knownUsers.users = _.without(knownUsers.users, newAlias);
                knownUsers.users.push(newParent);

                // Replace channels entries with new primary user
                updateChannels(event, newAlias, newParent);

                // Remove alias for new parent & add alias for new alias
                delete knownUsers.aliases[newParent];
                knownUsers.aliases[newAlias] = newParent;

                // Update aliases to point to new primary user
                updateAliases(event, newAlias, newParent);

                event.reply(dbot.t('aliasparentset', { 
                    'newParent': newParent, 
                    'newAlias': newAlias 
                }));

                dbot.api.stats.fixStats(event.server, newAlias);
            } else {
                event.reply(dbot.t('unknown_alias', { 'alias': newParent }));
            }
        },

        '~mergeusers': function(event) {
            var knownUsers = getServerUsers(event.server);
            var primaryUser = event.params[1];
            var secondaryUser = event.params[2];

            if(_.include(knownUsers.users, primaryUser) && _.include(knownUsers.users, secondaryUser)) {
                knownUsers.users = _.without(knownUsers.users, secondaryUser);
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
    };

    commands['~setaliasparent'].access = 'moderator';
    commands['~mergeusers'].access = 'moderator';

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
                if(!_.has(knownUsers.channelUsers, event.channel.name)) {
                    knownUsers.channelUsers[event.channel.name] = [];
                }
                var channelUsers = knownUsers.channelUsers[event.channel.name];

                if(api.isKnownUser(event.server, nick)) {
                    nick = api.resolveUser(event.server, nick);
                } else {
                    knownUsers.users.push(nick);
                }
                if(!_.include(channelUsers, nick)) {
                    channelUsers.push(nick);
                }
            } else if(event.action == 'NICK') {
                var newNick = event.params.substr(1);
                if(_.has(knownUsers.aliases, event.user)) {
                    knownUsers.aliases[newNick] = knownUsers.aliases[event.user];
                } else {
                    if(!_.include(knownUsers.users, newNick)) {
                        knownUsers.aliases[newNick] = event.user;
                    }
                }
            }
        },
        'on': ['JOIN', 'NICK'],
        
        'onLoad': function() {
            // Trigger updateNickLists to stat current users in channel
            var connections = dbot.instance.connections;
            _.each(connections, function(connection) {
                connection.updateNickLists(); 
            });
        }
    };
};

exports.fetch = function(dbot) {
    return users(dbot);
};
