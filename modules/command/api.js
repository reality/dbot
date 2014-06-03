var _ = require('underscore')._;

var api = function(dbot) {
    return {
        /**
         * Does the user have the correct access level to use the command?
         */
        'hasAccess': function(event, command, callback) {
            var accessNeeded = dbot.commands[command].access,
                allowedNicks,
                user = event.rUser;

            if(_.isUndefined(accessNeeded) || accessNeeded == null) {
                return callback(true);
            } else if(!_.isFunction(accessNeeded)) {
                if(_.has(dbot.access, accessNeeded)) {
                    accessNeeded = dbot.access[accessNeeded];
                } else {
                    return callback(true);
                }
            }
            allowedNicks = accessNeeded(event);

            if(!_.include(allowedNicks, user.primaryNick) && !_.include(allowedNicks, user.currentNick)) {
                callback(false);
            } else {
                if(_.has(dbot.modules, 'nickserv') && this.config.useNickserv == true) {
                    dbot.api.nickserv.auth(user.server, user.currentNick, function(result, primary) {
                        if(result == true && primary == user.primaryNick) {
                            callback(true);
                        } else {
                            callback(false);
                        }
                    });
                } else {
                    callback(true);
                }
            }
        },

        /**
         * Apply Regex to event message, store result. Return false if it doesn't
         * apply.
         */
        'applyRegex': function(commandName, event) {
            var applies = false;
            event.message = event.message.substring(1);
            if(_.has(dbot.commands[commandName], 'regex')) {
                var cRegex = dbot.commands[commandName].regex;
                if(_.isArray(cRegex) && cRegex.length === 2) {
                    var q = event.message.valMatch(cRegex[0], cRegex[1]);
                    if(q) {
                        applies = true;
                        event.input = q;
                    }
                } else {
                    var q = event.message.match(cRegex);
                    if(q) {
                        applies = true;
                        event.input = q;
                    }
                }
            } else {
                applies = true;
            }
            return applies;
        }
    };
};

exports.fetch = function(dbot) {
    return api(dbot);
};
