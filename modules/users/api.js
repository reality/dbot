var _ = require('underscore')._;

var api = function(dbot) {
    this.api = {
        // Retrieve a user record given a server and nickname
        'resolveUser': function(server, nick, callback) {
            var id = nick + '.' + server;
            this.api.getUser(id, function(err, result) {
                if(!err) {
                    callback(null, result);
                } else {
                    this.db.read('user_aliases', id, function(err, result) {
                        if(!err) {
                            this.api.getUser(result.user, callback);
                        } else {
                            callback(true, null);
                        }
                    }.bind(this));
                }
            }.bind(this));
        },

        // Retrive a user record given its ID
        'getUser': function(id, callback) {
            this.db.read('users', id, function(err, result) {
                if(!err) {
                    callback(null, result); 
                } else {
                    callback(true, null);
                }
            });
        },

        // Retrieve user aliases given a user ID
        'getUserAliases': function(id, callback) {
            var aliases = [];
            this.db.search('user_aliases', { 'user': id }, function(result) {
                aliases.push(result.alias);
            }, function(err) {
                if(!err) {
                    callback(null, aliases);
                } else {
                    callback(true, null);
                }
            });
        },

        // Retrieve a channel record given a server and a channel name
        'resolveChannel': function(server, channel, callback) {
            var id = channel + '.' + server;
            this.api.getChannel(id, callback);
        },

        // Retrieve a channel record given its ID
        'getChannel': function(id, callback) {
            this.db.read('channels', id, function(err, result) {
                if(!err) {
                    callback(null, result);
                } else {
                    callback(true, null);
                }
            });
        }
    };
};
