var _ = require('underscore')._,
    uuid = require('node-uuid'),
    databank = require('databank'),
    AlreadyExistsError = databank.AlreadyExistsError,
    NoSuchThingError = databank.NoSuchThingError,
    NotImplementedError = databank.NotImplementedError;

var api = function(dbot) {
    var escapeRegexen = function(str) {
        return (str+'').replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
    };

    var api = {
        // Return a user record given a primary nick or an alias
        'resolveUser': function(server, nick, callback) {
            var user = false;
            this.db.search('users', { 'server': server }, function(result) {
                if(result.primaryNick == nick || _.include(result.aliases, nick)) { 
                    user = result;
                }
            }, function(err) {
                if(!err) {
                    callback(user);
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

        'getChannel': function(server, channelName, callback) {
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
        }
    };

    api['resolveUser'].external = true;
    api['resolveUser'].extMap = [ 'server', 'nick', 'callback' ];

    api['getChannel'].external = true;
    api['getChannel'].extMap = [ 'server', 'channel', 'callback' ];

    api['getAllUsers'].external = true;
    api['getAllUsers'].extMap = [ 'callback' ];

    return api;
};

exports.fetch = function(dbot) {
    return api(dbot);
};
