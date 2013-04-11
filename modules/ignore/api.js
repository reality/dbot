var _ = require('underscore')._,
    databank = require('databank'),
    AlreadyExistsError = databank.AlreadyExistsError,
    NoSuchThingError = databank.NoSuchThingError,
    NotImplementedError = databank.NotImplementedError;

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
