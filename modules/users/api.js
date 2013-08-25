var _ = require('underscore')._,
    uuid = require('node-uuid'),
    databank = require('databank');

var api = function(dbot) {
    var escapeRegexen = function(str) {
        return (str+'').replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
    };

    var api = {
        // Return a user record given a primary nick or an alias
        'resolveUser': function(server, nick, callback) {
            if(_.has(this.userCache[server], nick)) {
                this.api.getUser(this.userCache[server][nick], callback);
            } else {
                this.db.search('users', { 'server': server }, function(result) {
                    if(result.primaryNick == nick || _.include(result.aliases, nick)) { 
                        this.userCache[server][nick] = result.id; 
                        return callback(result);
                    }
                }.bind(this), function(err) {});
            }
        },

        // Return many user records given primary nicks of aliases
        'resolveUsers': function(server, nicks, callback) {
            var users = [];
            this.db.search('users', { 'server': server }, function(result) {
                var pNicks = result.aliases.slice(0).unshift(result.primaryNick);
                for(var i=0;i<pNicks.length;i++) {
                    var n = _.indexOf(nicks, pNicks[i]);
                    if(n != -1) {
                        users.push(result);
                        nicks = _.without(nicks, nicks[n]);
                        break;
                    }
                }
            }, function(err) {
                if(!err) {
                    callback(users, nicks);
                }
            });
        },

        // Return a user record given a UUID
        'getUser': function(uuid, callback) {
            this.db.read('users', uuid, function(err, user) {
                if(err) user = false;
                callback(user);
            });
        },

        'resolveChannel': function(server, channelName, callback) {
            var channel = false;
            this.db.search('channel_users', {
                'server': server,
                'name': channelName
            }, function(result) {
                channel = result;
            }, function(err) {
                if(!err) {
                    callback(channel);
                }
            });
        },

        'getChannel': function(uuid, callback) {
            this.db.read('channel_users', uuid, function(err, channel) {
                if(err) channel = false;
                callback(channel);
            });
        },

        'getRandomChannelUser': function(server, channel, callback) {
            var channel;
            this.db.search('channel_users', { 
                'server': server,
                'channel': channel
            }, function(result) {
                channel = result; 
            }, function(err) {
                if(!err) {
                    if(!_.isUndefined(channel.users)) {
                        var randomUser = channel.users[_.random(0, channel.users.length - 1)];
                        this.api.resolveUser(server, randomUser, function(user) {
                            callback(user);
                        });
                    } else {
                        callback(false);
                    }
                } 
            });
        },

        'getAllUsers': function(callback) {
            var users = [];
            this.db.scan('users', function(user) {
                users.push(user); 
            }, function(err) {
                if(!err) {
                    callback(users);
                }
            });
        },

        'getAllChannels': function(callback) {
            var channels = [];
            this.db.scan('channel_users', function(channel) {
                channels.push(channel);
            }, function(err) {
                if(!err) {
                    callback(channels);
                }
            });
        },

        'isOnline': function(server, nick, channel, callback) {
            this.api.resolveUser(server, nick, function(user) {
                var possiNicks = [user].concat(user.aliases);

                if(_.has(dbot.instance.connections[server].channels, channel)) {
                    var onlineNicks = dbot.instance.connections[server].channels[channel].nicks;
                    var isOnline = _.any(onlineNicks, function(nick) {
                        nick = nick.name;
                        return _.include(possiNicks, nick); 
                    }, this);

                    callback(isOnline);
                }
            });
        },

        'isKnownUser': function(server, nick, callback) {
            this.api.resolveUser(server, nick, function(isKnown) {
                if(isKnown == false) {
                    callback(false);
                } else {
                    callback(true);
                }
            });
        }
    };

    api['resolveUser'].external = true;
    api['resolveUser'].extMap = [ 'server', 'nick', 'callback' ];

    api['getChannel'].external = true;
    api['getChannel'].extMap = [ 'server', 'channel', 'callback' ];

    api['getAllUsers'].external = true;
    api['getAllUsers'].extMap = [ 'callback' ];

    api['getAllChannels'].external = true;
    api['getAllChannels'].extMap = [ 'callback' ];

    return api;
};

exports.fetch = function(dbot) {
    return api(dbot);
};
