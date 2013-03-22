var _ = require('underscore')._;

var api = function(dbot) {
    var escapeRegexen = function(str) {
        return (str+'').replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
    };

    var api = {
        'resolveUser': function(server, nick, useLowerCase) {
            var user = nick;
            if(this.api.isPrimaryUser(nick)) {
                return user;
            } else {
                this.db.search('user', { 'server': server }, function(user) {
                    if(_.include(user.aliases, nick)) user = user.primaryNick; 
                }.bind(this), function(err) {
                    if(err instanceof NotImplementedError) {
                        // QQ
                    }
                });
                return user;
            }

            /** TODO: Re-add lowercase support
            if(!useLowerCase) {
                if(!_.include(knownUsers.users, nick) && _.has(knownUsers.aliases, nick)) {
                    user = knownUsers.aliases[nick];
                }
            } else {
                // this is retarded
                user = user.toLowerCase();
                var toMatch = new RegExp("^" + escapeRegexen(user) + "$", "i");

                var resolvedUser = _.find(knownUsers.users, function(nick) {
                    return nick.match(toMatch) !== null; 
                }, this);

                if(!resolvedUser) {
                    resolvedUser = _.find(knownUsers.aliases, function(nick, alias) {
                        if(alias.match(toMatch) !== null) return nick;
                    }, this);
                    if(!_.isUndefined(resolvedUser)) user = resolvedUser;
                }
                else{
                    user = resolvedUser;
                }
            }
            return user;
            **/
        },

        'getRandomChannelUser': function(server, channel) {
            this.db.get('channel_users', { '' })
            var channelUsers = this.getServerUsers(server).channelUsers[channel];
            if(!_.isUndefined(channelUsers)) {
                return channelUsers[_.random(0, channelUsers.length - 1)];
            } else {
                return false;
            }
        },

        'getServerUsers': function(server) {
            var users = [];
            this.db.search('user', { 'server': server }, function(user) {
                users.push(user.primaryNick); 
            }.bind(this), function(err) {
                if(err instanceof NotImplementedError) {
                    // QQ
                }
            });

            return users;
        },

        'getAllUsers': function() {
            return _.reduce(dbot.db.knownUsers, function(memo, server, name) {
                memo[name] = server.users;
                return memo;
            }, {}, this);
        },

        'isKnownUser': function(server, nick) {
            var knownUsers = this.getServerUsers(server); 
            return (_.include(knownUsers.users, nick) || _.has(knownUsers.aliases, nick));
        },

        'isPrimaryUser': function(server, nick) {
            var knownUsers = this.getServerUsers(server); 
            return _.include(knownUsers.users, nick);
        },

        'getAliases': function(server, nick) {
            var knownUsers = this.getServerUsers(server);
            return _.chain(knownUsers.aliases)
                .keys()
                .filter(function(user) {
                    return knownUsers.aliases[user] == nick;
                }, this)
                .value();
        },

        'isOnline': function(server, user, channel, useLowerCase) {
            var user = this.api.resolveUser(server, user, useLowerCase);
            var possiNicks = [user].concat(this.api.getAliases(server, user));

            if(!_.has(dbot.instance.connections[server].channels, channel)) return false;
            var onlineNicks = dbot.instance.connections[server].channels[channel].nicks;

            return _.any(onlineNicks, function(nick) {
                nick = nick.name;
                return _.include(possiNicks, nick); 
            }, this);
        },

        'isChannelUser': function(server, user, channel, useLowerCase) {
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
