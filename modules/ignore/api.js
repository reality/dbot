var _ = require('underscore')._,
    databank = require('databank'),
    AlreadyExistsError = databank.AlreadyExistsError,
    NoSuchThingError = databank.NoSuchThingError,
    NotImplementedError = databank.NotImplementedError;

var api = function(dbot) {
    return {
        'isUserIgnoring': function(server, user, item, callback) {
            dbot.api.users.resolveUser(server, user, function(user) {
                this.db.read('ignores', user.id, function(err, ignores) {
                    var isIgnoring = false;
                    if(ignores) {
                        if(_.has(dbot.commands, item)) {
                            item = moduleName = dbot.commands[item].module;
                        }
                        if(_.include(ignores.ignores, item)) {
                            isIgnoring = true;
                        }
                    }
                    callback(isIgnoring);
                });
            }.bind(this));
        }
    };
}

exports.fetch = function(dbot) {
    return api(dbot);
};
