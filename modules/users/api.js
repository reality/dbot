var _ = require('underscore')._;

var api = function(dbot) {
    var api = {
        'resolveUser': function(server, nick, useLowercase) {
            var knownUsers = this.getServerUsers(server); 
            var user = nick;
            if(!_.include(knownUsers.users, nick) && _.has(knownUsers.aliases, nick)) {
                user = knownUsers.aliases[nick];
            }

            if(useLowercase) user = user.toLowerCase();
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
        }
    };

    return api;
};

exports.fetch = function(dbot) {
    return api(dbot);
};
