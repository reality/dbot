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
                'id': id,
                'primaryNick': nick,
                'currentNick': nick,
                'server': server,
                'channels': [ channel ],
                'aliases': []
            }, function(err, result) {
                if(!err) {
                    dbot.api.event.emit('new_user', [ result ]);
                    callback(result);
                }
            });
        }.bind(this),

        'createChannel': function(server, name, callback) {
            var id = uuid.v4();
            this.db.create('channel_users', id, {
                'id': id,
                'server': server,
                'name': name,
                'users': []
            }, function(err, result) {
                if(!err) {
                    dbot.api.event.emit('new_channel', [ result ]);
                    callback(result);
                }
            });
        }.bind(this),

        'addChannelUser': function(user, channelName, callback) {
            this.api.getChannel(user.server, channelName, function(channel) {
                channel.users.push(user.id);
                this.db.save('channel_users', channel.id, channel, function(err) {
                    if(!err) {
                        dbot.api.event.emit('new_channel_user', [ user, channel ]);
                        callback();
                    }
                });
            }.bind(this));
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
        }.bind(this),

        'mergeChannelUsers': function(server, oldUser, newUser) {
            newUser.channels = _.union(oldUser.channels, newUser.channels);
            _.each(newUser.channels, function(name) {
                this.api.getChannel(server, name, function(channel) {
                    if(_.include(channel.users, oldUser.id)) {
                        channel.users = _.without(channel.users, oldUser.id);
                    }
                    if(!_.include(channel.users, newUser.id)) {
                        channel.users.push(newUser.id);
                    }
                    this.db.save('channel_users', channel.id, channel, function(err) {
                        if(err) {
                            // QQ
                        }
                    });
                }.bind(this));
            }, this);
        }.bind(this)
    };

    this.listener = function(event) {
        if(event.action == 'JOIN' && event.user != dbot.config.name) {
            this.api.resolveUser(event.server, event.user, function(user) {
                var needsUpdating = false;

                if(!user) { // User does not yet exist 
                    user = {
                        'id': uuid.v4(),
                        'primaryNick': event.user,
                        'currentNick': event.user,
                        'server': event.server,
                        'channels': [],
                        'aliases': []
                    };
                    needsUpdating = true;
                }

                if(!_.include(user.channels, event.channel.name)) { // User not yet channel user
                    user.channels.push(event.channel.name);
                    this.internalAPI.addChannelUser(user, event.channel.name, function(err) { });
                    needsUpdating = true;
                }

                if(user.currentNick != event.user) {
                    user.currentNick = event.user;
                    needsUpdating = true;
                }

                if(needsUpdating == true) {
                    this.db.save('users', user.id, user, function(err) { });
                }
            }.bind(this));
        } else if(event.action == 'NICK') {
            this.api.resolveUser(event.server, event.user, function(user) {
                this.api.isKnownUser(event.server, event.newNick, function(isKnown) {
                    user.currentNick = event.newNick;

                    if(!isKnown) {
                        user.aliases.push(event.newNick);
                    }

                    this.db.save('users', user.id, user, function(err) {
                        if(!err) {
                            dbot.api.event.emit('new_user_alias', [ user, event.newNick ]);
                        }
                    });
                }.bind(this));
            }.bind(this));
        }
    }.bind(this);
    this.on =  ['JOIN', 'NICK'];

    this.onLoad = function() {
        dbot.instance.addPreEmitHook(function(event, callback) {
            if(event.user) {
                this.api.resolveUser(event.server, event.user, function(user) {
                    event.rUser = user;
                    callback(false);
                });
            }
        }.bind(this));
        
        dbot.instance.addPreEmitHook(function(event, callback) {
            if(event.channel) {
                this.api.getChannel(event.server, event.channel.name, function(channel) {
                    event.rChannel = channel;
                    callback(false);
                });
            }
        }.bind(this));

        dbot.instance.addListener('366', 'users', function(event) {
            var checkChannel = function(channel) {
                async.eachSeries(event.channel.nicks, function(nick, next) {
                    this.api.resolveUser(event.server, nick, function(user) {
                        var checkChannelUser = function(user) {
                            if(!_.inlude(channel.users, user.id)) {
                                this.internalAPI.addChannelUser(channel, user, next); 
                            } else {
                                next();
                            }
                        }.bind(this);

                        if(user) {
                            checkChannelUser(user); 
                        } else {
                            this.internalAPI.createUser(event.server, nick, channel.id, checkChannelUser);
                        }
                    }.bind(this));
                });
            };
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
