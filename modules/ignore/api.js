var _ = require('underscore')._;

var api = function(dbot) {
    return {
        // Is user ignoring command/module?
        'isUserIgnoring': function(user, item, callback) {
            this.internalAPI.isUserImpeded(user, item, 'ignores', callback);
        },

        // Is user banned from command/module?
        'isUserBanned': function(user, item, callback) {
            this.internalAPI.isUserImpeded(user, item, 'bans', callback);
        },

        // Is channel ignoring module?
        // TODO: Command support
        'isChannelIgnoring': function(channelName, item, callback) {
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
        'getUserIgnores': function(user, callback) {
            this.db.read('ignores', user.id, function(err, ignores) {
                if(!err && ignores) {
                    callback(false, ignores);
                } else {
                    callback(true, null);
                }
            });
        }
    };
}

exports.fetch = function(dbot) {
    return api(dbot);
};
