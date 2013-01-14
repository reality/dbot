var _ = require('underscore')._;

var api = function(dbot) {
    return {
        'isBanned': function(user, command) {
            var banned = false;
            if(_.has(dbot.db.bans, command)) {
                if(_.include(dbot.db.bans[command], user) || _.include(dbot.db.bans['*'], user)) {
                    banned = true;
                }
            }
            return banned;
        },

        /**
         * Does the user have the correct access level to use the command?
         */
        'hasAccess': function(user, command) {
            var access = true;
            var accessNeeded = dbot.commands[command].access;

            if(accessNeeded == 'admin') {
                if(!_.include(dbot.config.admins, user)) {
                    access = false;
                }
            } else if(accessNeeded == 'moderator') {
                if(!_.include(dbot.config.moderators, user) && 
                        !_.include(dbot.config.admins, user)) {
                    access = false;
                }
            }

            return access;
        },

        /**
         * Is user ignoring command?
         */
        'isIgnoring': function(user, command) {
            var module = dbot.commands[command].module;
            var ignoring = false;
            if(_.has(dbot.db.ignores, user) && _.include(dbot.db.ignores[user], module)) {
                ignoring = true;
            }
            return ignoring;
        },

        /**
         * Apply Regex to event message, store result. Return false if it doesn't
         * apply.
         */
        'applyRegex': function(commandName, event) {
            var applies = false;
            if(_.has(dbot.commands[commandName], 'regex')) {
                var cRegex = dbot.commands[commandName].regex;
                var q = event.message.valMatch(cRegex[0], cRegex[1]);
                if(q) {
                    applies = true;
                    event.input = q;
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
