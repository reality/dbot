/**
 * Name: Users
 * Description: Track known users
 */
var _ = require('underscore')._,
    uuid = require('node-uuid');

var users = function(dbot) {

    /*** Internal API ***/
    this.internalAPI = {
        'createUser': function(server, nick, callback) {
            this.db.create('users', id, {
                'id': uuid.v4(),
                'primaryNick': nick,
                'currentNick': nick,
                'server': server,
                'channels': [ ],
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

        'addChannelUser': function(channel, user, callback) {
            if(!_.include(channel.users, user.id)) {
                channel.users.push(user.id);
            }
            if(!_.include(user.channels, channel.id) {
                user.channels.push(channel.id);
            }

            this.db.save('users', user.id, user, function(err) {
                this.db.save('channel_users', channel.id, channel, function(err) {
                    dbot.api.event.emit('new_channel_user', [ user, channel ]);
                    callback(err);
                });
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
        // TODO: If user joins channel with alias
        if(event.action == 'JOIN' && event.user != dbot.config.name) {
            if(!event.rUser) {
                this.internalAPI.createUser(event.server, event.user, function(user) {
                    this.internalAPI.addChannelUser(channel, user, function() {}); 
                });
            } else if(!_.include(event.rUser.channels, event.rChannel.id)) {
                this.internalAPI.addChannelUser(channel, user, function() {}); 
            }
        } else if(event.action == 'NICK') {
            this.api.isKnownUser(event.server, event.newNick, function(isKnown) {
                event.rUser.currentNick = event.newNick;

                if(!isKnown) {
                    event.rUser.aliases.push(event.newNick);
                }

                this.db.save('users', event.rUser.id, event.rUser, function(err) {
                    dbot.api.event.emit('new_user_alias', [ event.rUser, event.newNick ]);
                });
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
                            this.internalAPI.createUser(event.server, nick, checkChannelUser);
                        }
                    }.bind(this));
                });
            };
        }.bind(this));

        _.each(dbot.instance.connections, function(connection) {
            connection.updateNickLists(); 
        });
    };
};

exports.fetch = function(dbot) {
    return new users(dbot);
};
