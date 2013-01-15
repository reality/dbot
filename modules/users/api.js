var _ = require('underscore')._;

var api = function(dbot) {
    var api = {
        'resolveUser': function(server, nick, useLowerCase) {
            var knownUsers = this.getServerUsers(server); 
            var user = nick;

            if(!useLowerCase) {
                if(!_.include(knownUsers.users, nick) && _.has(knownUsers.aliases, nick)) {
                    user = knownUsers.aliases[nick];
                }
            } else {
                // this is retarded
                user = user.toLowerCase();
                var resolvedUser = _.find(knownUsers.users, function(nick) {
                    var toMatch = new RegExp(_.escape(user), "i");
                    return nick.match(toMatch) !== null; 
                }, this);

                if(!resolvedUser) {
                    resolvedUser = _.find(knownUsers.aliases, function(nick, alias) {
                        var toMatch = new RegExp(_.escape(user), "i");
                        return alias.match(toMatch) !== null;
                    }, this);
                    user = knownUsers.aliases[resolvedUser];
                } else {
                    user = resolvedUser;
                }
            }

            return user;
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
            var onlineNicks = dbot.instance.connections[server].channels[channel].nicks;

            return _.any(onlineNicks, function(nick) {
                nick = nick.name;
                return _.include(possiNicks, nick); 
            }, this);
        }
    };

    return api;
};

exports.fetch = function(dbot) {
    return api(dbot);
};
