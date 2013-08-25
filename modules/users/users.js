/**
 * Name: Users
 * Description: Track known users
 */
var _ = require('underscore')._,
    uuid = require('node-uuid'),
    async = require('async');

var users = function(dbot) {
    this.userCache = {};
    _.each(dbot.config.servers, function(v, k) {
        this.userCache[k] = {};
    }.bind(this));

    /*** Internal API ***/
    this.internalAPI = {
        'createUser': function(server, nick, callback) {
            var id = uuid.v4();
            this.db.create('users', id, {
                'id': id,
                'primaryNick': nick,
                'currentNick': nick,
                'server': server,
                'channels': [],
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
                'users': [],
                'op': [],
                'voice': []
            }, function(err, result) {
                if(!err) {
                    dbot.api.event.emit('new_channel', [ result ]);
                    callback(result);
                }
            });
        }.bind(this),

        'addChannelUser': function(channel, user, staff, callback) {
            if(!_.include(channel.users, user.id)) {
                channel.users.push(user.id);
            }
            if(!_.include(user.channels, channel.id)) {
                user.channels.push(channel.id);
            }

            if(!channel.op) channel.op = [];
            if(!channel.voice) channel.voice = [];

            if(staff.op) {
                channel.op.push(user.id);
            } else if(staff.voice) {
                channel.voice.push(user.id);
            }

            this.db.save('users', user.id, user, function(err) {
                this.db.save('channel_users', channel.id, channel, function(err) {
                    dbot.api.event.emit('new_channel_user', [ user, channel ]);
                    callback(err);
                });
            }.bind(this));
        }.bind(this),

        'mergeChannelUsers': function(oldUser, newUser) {
            newUser.channels = _.union(oldUser.channels, newUser.channels);
            _.each(newUser.channels, function(uuid) {
                this.api.getChannel(uuid, function(channel) {
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
        this.api.isKnownUser(event.server, event.newNick, function(isKnown) {
            event.rUser.currentNick = event.newNick;

            if(!isKnown) {
                event.rUser.aliases.push(event.newNick);
            }

            this.db.save('users', event.rUser.id, event.rUser, function(err) {
                dbot.api.event.emit('new_user_alias', [ event.rUser, event.newNick ]);
            });
        }.bind(this));
    }.bind(this);
    this.on = ['NICK'];

    this.onLoad = function() {
        dbot.instance.addPreEmitHook(function(event, callback) {
            // 1. Attempt to resolve channel
            // 2. Create channel if it doesn't exist
            // 3. Attempt to resolve user
            // 4. Create user if it doesn't exist
            // 5. Make sure channel objects are up to date
            // 6. Update staff channel lists

            var checkChannel = function(done) {
                this.api.resolveChannel(event.server, event.channel.name, function(channel) {
                    if(!channel) {
                        this.internalAPI.createChannel(event.server, event.channel.name, done);
                    } else {
                        done(channel);
                    }
                }.bind(this));
            }.bind(this);
            var checkUser = function(done) {
                this.api.resolveUser(event.server, event.user, function(user) {
                    if(!user) {
                        this.internalAPI.createUser(event.server, event.user, done);
                    } else {
                        if(event.user != user.currentNick) {
                            user.currentNick = event.user;
                            this.db.save('users', user.id, user, function() { done(user); });
                        } else {
                            done(user);
                        }
                    }
                }.bind(this));
            }.bind(this);
            var checkChannelUsers = function(done) {
                var needsUpdating = false;

                if(!_.include(event.rUser.channels, event.rChannel.id)) {
                    event.rUser.channels.push(event.rChannel.id);
                    event.rChannel.users.push(event.rUser.id);
                    dbot.api.event.emit('new_channel_user', [ event.rUser, event.rChannel ]);

                    // since it's not in event.channel yet we have to do this here
                    this.db.save('users', event.rUser.id, event.rUser, function() {
                        this.db.save('channel_users', event.rChannel.id, event.rChannel, function() {});
                    }.bind(this));

                    return done();
                }

                if(!_.has(event.channel, 'nicks') || !_.has(event.channel.nicks, event.rUser.currentNick)) {
                    return done();
                }
                var cUser = event.channel.nicks[event.rUser.currentNick];

                if(!_.include(event.rChannel.op, event.rUser.id) && cUser.op) {
                    event.rChannel.op.push(event.rUser.id);
                    needsUpdating = true;
                } else if(!_.include(event.rChannel.voice, event.rUser.id) && cUser.voice) {
                    event.rChannel.voice.push(event.rUser.id);
                    needsUpdating = true;
                } else if(_.include(event.rChannel.op, event.rUser.id) && !cUser.op) {
                    event.rChannel.op = _.without(event.rChannel.op, event.rUser.id);
                    needsUpdating = true;
                } else if(_.include(event.rChannel.voice, event.rUser.id) && !cUser.voice) {
                    event.rChannel.voice = _.without(event.rChannel.voice, event.rUser.id);
                    needsUpdating = true;
                }

                if(needsUpdating) {
                    this.db.save('users', event.rUser.id, event.rUser, function() {
                        this.db.save('channel_users', event.rChannel.id, event.rChannel, done);
                    }.bind(this));
                } else {
                    done();
                }
            }.bind(this);

            if(event.user && event.channel && _.include(['JOIN', 'MODE', 'PRIVMSG'], event.action)) {
                checkChannel(function(channel) {
                    event.rChannel = channel;
                    checkUser(function(user) {
                        event.rUser = user;

                        if(!_.has(this.userCache[event.server], event.rUser.currentNick)) {
                            this.userCache[event.server][event.rUser.currentNick] = event.rUser.id;
                        } else if(this.userCache[event.server][event.rUser.currentNick] != event.rUser.id) {
                            this.userCache[event.server][event.rUser.currentNick] = event.rUser.id;
                        }

                        checkChannelUsers(function() {
                            callback();
                        });
                    }.bind(this));
                }.bind(this));
            } else if(event.user) {
                this.api.resolveUser(event.server, event.user, function(user) {
                    if(user) event.rUser = user;
                    if(event.channel) {
                        this.api.resolveChannel(event.server, event.channel.name, function(channel) {
                            if(channel) event.rChannel = channel;
                            callback();
                        });
                    } else {
                        callback();
                    }
                }.bind(this));
            }
        }.bind(this));

        _.each(dbot.instance.connections, function(connection) {
            connection.updateNickLists(); 
        });
    };
};

exports.fetch = function(dbot) {
    return new users(dbot);
};
