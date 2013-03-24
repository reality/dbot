/**
 * Name: Users
 * Description: Track known users
 */
var _ = require('underscore')._;

var users = function(dbot) {
    this.knownUsers = dbot.db.knownUsers;

    this.updateAliases = function(event, oldUser, newUser) {
        var knownUsers = this.getServerUsers(event.server);
        _.each(knownUsers.aliases, function(user, alias) {
            if(user == oldUser) {
                knownUsers.aliases[alias] = newUser;
            }
        }, this);
    };

    this.updateChannels = function(event, oldUser, newUser) {
        var channelUsers = this.getServerUsers(event.server).channelUsers;
        channelUsers = _.each(channelUsers, function(channel, channelName) {
            channelUsers[channelName] = _.without(channel, oldUser);
            channelUsers[channelName].push(newUser);
        }, this);
    };

    this.internalAPI = {
        'createUser': function(server, nick, channel, callback) {
            var id = uuid.v4();
            this.db.create('users', id, {
                'uuid': id,
                'primaryNick': nick,
                'currentNick': nick,
                'server': server,
                'channels': [ channel ],
                'aliases': []
            }, function(err, result) {
                if(!err) {
                    dbot.api.event.emit('new_user', [ user ]);
                    callback(result);
                }
            });
        },

        'addChannelUser': function(user, channelName) {
            user.channels.push(channelName);
            this.db.save('users', user.id, user, function(err) {
                if(!err) {
                    this.api.getChannel(user.server, channelName, function(channel) {
                        channel.users.push(user.primaryNick);
                        this.db.save('channel_users', channel.id, channel, function(err) {
                            if(!err) {
                                dbot.api.event.emit('new_channel_user', [ user, channel]);
                            }
                        });
                    });
                }
            });
        }
    };

    this.listener = function(event) {
        if(event.action == 'JOIN' && nick != dbot.config.name) {
            this.api.resolveUser(event.server, event.user, function(user) {
                if(!user) { // User does not yet exist 
                    this.internalAPI.createUser(event.server, event.user, event.channel, function(result) {
                        user = result;
                    });
                } 
                
                if(!_.include(user.channels, event.channel)) { // User not yet channel user
                    this.internalAPI.addChannelUser(user, event.channel);
                }
            }
        } else if(event.action == 'NICK') {
            if(!this.api.isKnownUser(event.newNick)) {
                this.api.resolveUser(event.server, event.user, function(user) {
                    user.aliases.push(event.newNick);
                    this.db.save('users', user.id, function(err) {
                        if(!err) {
                            dbot.api.event.emit('new_user_alias', [ user, event.newNick ]);
                        }
                    });
                });
            }
        }
    }.bind(this);
    this.on =  ['JOIN', 'NICK'];

    this.onLoad = function() {
        dbot.instance.addListener('366', 'users', function(event) {
            this.api.getChannel(event.server, event.channel, function(channel) {
                if(!channel) { // Channel does not yet exist
                    var id = uuid.v4();
                    this.db.create('channel_users', id, {
                        'uuid': id,
                        'server': event.server,
                        'name': event.channel,
                        'users': []
                    }, function(err, result) {
                        if(!err) {
                            channel = result;
                            dbot.api.event.emit('new_channel', [ channel ]);
                        }
                    });
                }

                _.each(event.channel.nicks, function(nick) {
                    this.api.resolveUser(event.server, nick, function(user) {
                        if(!user) {
                            this.internalAPI.createUser(event.server, nick, event.channel, function(result) {
                                user = result;
                            });
                        }
                        
                        if(!_.include(user.channels, event.channel)) {
                            this.internalAPI.addChannelUser(user, event.channel);
                        }
                    });
                }, this);
            });

            var connections = dbot.instance.connections;
            _.each(connections, function(connection) {
                connection.updateNickLists(); 
            });
        });
    };
};

exports.fetch = function(dbot) {
    return new users(dbot);
};
