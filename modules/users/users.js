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
        
    this.listener = function(event) {
        if(event.action == 'JOIN' && nick != dbot.config.name) {
            this.api.resolveUser(event.server, event.user, function(user) {
                if(!user) { // User does not yet exist 
                    var id = uuid.v4();
                    this.db.create('users', id, {
                        'uuid': id,
                        'primaryNick': event.user,
                        'currentNick': event.user,
                        'server': event.server,
                        'channels': [ event.channel ],
                        'aliases': []
                    }, function(err, result) {
                        if(!err) {
                            user = result;
                            dbot.api.event.emit('new_user', [ user ]);
                        }
                    });
                } 
                
                if(!_.include(user.channels, event.channel)) { // User not yet channel user
                    user.channels.push(event.channel);
                    this.db.save('users', user.id, user, function(err) {
                        if(!err) {
                            this.api.getChannel(event.server, event.channel, function(channel) {
                                channel.users.push(user.primaryNick);
                                this.db.save('channel_users', channel.id, channel, function(err)) {
                                    if(!err) {
                                        dbot.api.event.emit('new_channel_user', [ user ]);
                                    }
                                });
                            }
                        }
                    });
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
        /* Trigger updateNickLists to stat current users in channel
        dbot.instance.addListener('366', 'users', function(event) {
            var knownUsers = this.getServerUsers(event.server);
            if(!_.has(knownUsers.channelUsers, event.channel.name)) {
                knownUsers.channelUsers[event.channel.name] = [];
            }
            var channelUsers = knownUsers.channelUsers[event.channel.name];

            _.each(event.channel.nicks, function(nick) {
                nick = nick.name;
                if(this.api.isKnownUser(event.server, nick)) {
                    nick = this.api.resolveUser(event.server, nick);
                } else {
                    knownUsers.users.push(nick);
                    dbot.api.event.emit('new_user', [ event.server, nick ]);
                }
                if(!_.include(channelUsers, nick)) {
                    channelUsers.push(nick);
                }
            }, this);
        }.bind(this));

        var connections = dbot.instance.connections;
        _.each(connections, function(connection) {
            connection.updateNickLists(); 
        });*/
    };
};

exports.fetch = function(dbot) {
    return new users(dbot);
};
