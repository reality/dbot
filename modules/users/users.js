/**
 * Name: Users
 * Description: Track known users
 */
var _ = require('underscore')._,
    uuid = require('node-uuid');

var users = function(dbot) {

    /*** Internal API ***/
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
                    dbot.api.event.emit('new_user', [ result ]);
                    callback(result);
                    dbot.say('aberwiki', '#realitest', result.server);
                    dbot.say('aberwiki', '#realitest', result.primaryNick);
                }
            });
        }.bind(this),

        'addChannelUser': function(user, channelName) {
            user.channels.push(channelName);
            dbot.say('aberwiki', '#realitest', user.id);
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
        }.bind(this), 

        'updateChannelPrimaryUser': function(server, oldUser, newUser) {
            this.db.search('channel_users', { 'server': server }, function(channel) {
                channel.users = _.without(channel.users, oldUser);
                if(!_.include(channel.users, newUser)) channel.users.push(newUser);
                this.db.save('channel_users', channel.id, channel, function(err) {
                    if(err) {
                        // QQ
                    }
                });
            }.bind(this), function(err) {
                if(err) {
                    // QQ
                }
            });
        }.bind(this)
    };

    this.listener = function(event) {
        if(event.action == 'JOIN' && event.user != dbot.config.name) {
            this.api.resolveUser(event.server, event.user, function(user) {
                if(!user) { // User does not yet exist 
                    this.internalAPI.createUser(event.server, event.user, event.channel, function(result) {
                        user = result;
                        if(!_.include(user.channels, event.channel)) { // User not yet channel user
                            this.internalAPI.addChannelUser(user, event.channel.name);
                        }
                    });
                } else {
                    if(!_.include(user.channels, event.channel)) { // User not yet channel user
                        this.internalAPI.addChannelUser(user, event.channel.name);
                    }
                }
            }.bind(this));
        } else if(event.action == 'NICK') {
            this.api.isKnownUser(event.server, event.newNick, function(isKnown) {
                if(!isKnown) {
                    this.api.resolveUser(event.server, event.user, function(user) {
                        dbot.say('aberwiki', '#realitest', event.newNick);
                        user.aliases.push(event.newNick);
                        this.db.save('users', user.id, user, function(err) {
                            if(!err) {
                                dbot.api.event.emit('new_user_alias', [ user, event.newNick ]);
                            }
                        });
                    }.bind(this));
                }
            }.bind(this));
        }
    }.bind(this);
    this.on =  ['JOIN', 'NICK'];

    this.onLoad = function() {
        dbot.instance.addListener('366', 'users', function(event) {
            this.api.getChannel(event.server, event.channel.name, function(channel) {
                if(!channel) { // Channel does not yet exist
                    var id = uuid.v4();
                    this.db.create('channel_users', id, {
                        'uuid': id,
                        'server': event.server,
                        'name': event.channel.name,
                        'users': []
                    }, function(err, result) {
                        if(!err) {
                            channel = result;
                            dbot.api.event.emit('new_channel', [ channel ]);
                        }
                    });
                }

                _.each(event.channel.nicks, function(nick) {
                    var nick = nick.name;
                    this.api.resolveUser(event.server, nick, function(user) {
                        if(!user) {
                            this.internalAPI.createUser(event.server, nick, event.channel, function(result) {
                                user = result;
                                if(!_.include(user.channels, event.channel)) {
                                    this.internalAPI.addChannelUser(user, event.channel.name);
                                }
                            });
                        } else {
                            if(!_.include(user.channels, event.channel)) {
                                this.internalAPI.addChannelUser(user, event.channel.name);
                            }
                        }
                    }.bind(this));
                }, this);
            }.bind(this));
        }.bind(this));

        var connections = dbot.instance.connections;
        _.each(connections, function(connection) {
            connection.updateNickLists(); 
        });
    };
};

exports.fetch = function(dbot) {
    return new users(dbot);
};
