var _ = require('underscore')._,
    uuid = require('node-uuid');
    databank = require('databank'),
    AlreadyExistsError = databank.AlreadyExistsError,
    NoSuchThingError = databank.NoSuchThingError,
    NotImplementedError = databank.NotImplementedError;

var api = function(dbot) {
    var escapeRegexen = function(str) {
        return (str+'').replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
    };

    var api = {
        'resolveUser': function(server, nick, callback) {
            if(this.api.isPrimaryUser(nick)) {
                callback(nick);
            } else {
                var user = false;
                this.db.search('user', { 'server': server }, function(user) {
                    if(_.include(user.aliases, nick)) user = user.primaryNick; 
                }, function(err) {
                    if(!err) {
                        callback(user);
                    }
                });
            }
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
                        callback(channel.users[_.random(0, channel.users.length - 1)]);
                    } else {
                        callback(false);
                    }
                } 
            });
        },

        'getServerUsers': function(server, callback) {
            var users = [];
            this.db.search('users', { 'server': server }, function(user) {
                users.push(user); 
            }, function(err) {
                if(!err) {
                    callback(users);
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

        'isKnownUser': function(server, nick, callback) {
            this.api.resolveUser(server, nick, function(isKnown) {
                if(isKnown == false) {
                    callback(false);
                } else {
                    callback(true);
                }
            });
        },

        'isPrimaryUser': function(server, nick, callback) {
            var isPrimaryUser = false; 
            this.db.search('users', {
                'server': server,
                'primaryNick': nick 
            }, function(user) {
                isPrimaryUser = true;
            }, function(err) {
                if(!err) {
                    callback(isPrimaryUser);
                }
            });
        },

        'getAliases': function(server, nick, callback) {
            var aliases;
            this.db.search('users', { 
                'server': server,
                'primaryNick': nick
            }, function(result) {
                aliases = result.aliases; 
            }, function(err) {
                callback(aliases); 
            });
        },

        'isOnline': function(server, user, channel, callback) {
            var user = this.api.resolveUser(server, user, useLowerCase);
            var possiNicks = [user].concat(this.api.getAliases(server, user));

            if(!_.has(dbot.instance.connections[server].channels, channel)) return false;
            var onlineNicks = dbot.instance.connections[server].channels[channel].nicks;

            var isOnline = _.any(onlineNicks, function(nick) {
                nick = nick.name;
                return _.include(possiNicks, nick); 
            }, this);

            callback(isOnline);
        },

        'isChannelUser': function(server, user, channel) {
            var knownUsers = this.getServerUsers(server);
            var user = this.api.resolveUser(server, user, useLowerCase); 

            if(!_.has(knownUsers.channelUsers, channel)) {
                return false;
            } 
            return _.include(knownUsers.channelUsers[channel], user);
        }
    };

    return api;
};

exports.fetch = function(dbot) {
    return api(dbot);
};
