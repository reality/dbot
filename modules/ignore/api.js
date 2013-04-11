var _ = require('underscore')._;

var api = function(dbot) {
    return {
        // Is user ignoring command/module?
        'isUserIgnoring': function(server, user, item, callback) {
            this.internalAPI.isUserImpeded(server, user, item, 'ignores', callback);
        },

        // Is user banned from command/module?
        'isUserBanned': function(server, user, item, callback) {
            this.internalAPI.isUserImpeded(server, user, item, 'bans', callback);
        },

        // Is channel ignoring module?
        // TODO: Command support
        'isChannelIgnoring': function(server, channelName, item, callback) {
            var isIgnoring = false,
                channel = false;

            this.db.search('channel_ignores', {
                'server': server,
                'name': channel
            }, function(result) {
                channel = result;
            }, function(err) {
                if(!err && channel && _.include(channel.ignores, item)) {
                    isIgnoring = true;
                }
                callback(isIgnoring);
            });
        },

        // Resolve a nick and return their user and ignores object
        'getUserIgnores': function(server, user, callback) {
            dbot.api.users.resolveUser(server, user, function(user) {
                if(user) {
                    this.db.read('ignores', user.id, function(err, ignores) {
                        callback(false, user, ignores);
                    });
                } else {
                    callback(true, null, null);
                }
            }.bind(this));
        }
    };
}

exports.fetch = function(dbot) {
    return api(dbot);
};
