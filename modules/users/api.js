var _ = require('underscore')._;

var api = function(dbot) {
    var api = {
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
            this.api.getUser(id, function(err, user) {
              if(!err) {
                  callback(null, user.aliases);
              } else {
                  callback(true, null);
              }
            });
        },
        
        // Check if a nick is online under a given alias
        'isOnline': function(server, channel, nick, callback) {
            this.api.resolveUser(server, nick, function(err, user) {
                if(user) {
                    this.api.getUserAliases(user.id, function(err, aliases) {
                        aliases.push(nick);

                        var onlineNicks = _.keys(dbot.instance.connections[server].channels[channel].nicks);
                        var isOnline = _.any(onlineNicks, function(nick) {
                            return _.include(aliases, nick);
                        }, this);

                        callback(null, user, isOnline);
                    });
                } else {
                    callback(true, null, null);
                }
            }.bind(this));
        }
    };

    api['getUserAliases'].external = true;
    api['getUserAliases'].extMap = [ 'id', 'callback' ];

    return api;
};

exports.fetch = function(dbot) {
    return api(dbot);
};
