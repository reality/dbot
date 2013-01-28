var _ = require('underscore')._;

var api = function(dbot) {
    return {

        /**
         * Create a profile for a new primary user on a given server.
         * If the server does not already exist, create it.
         */
        "createProfile": function(server, primary){
            var primaryLower = primary.toLowerCase();

            if(!_.has(this.profiles, server)){
                this.profiles[server] = {};
            }
            if(!_.has(this.profiles[server], primaryLower)){
                this.profiles[server][primaryLower] = {
                    "profile": {},
                    "preferences": {}
                };
                this.profiles[server][primaryLower].profile.primary = primary;
            }

            // Ensure all profiles have the keys specified by config.json
            //TODO(samstudio8) Currently only handles "top-level"
            _.defaults(this.profiles[server][primaryLower].profile, this.config.schema.profile);
            _.defaults(this.profiles[server][primaryLower].preferences, this.config.schema.preferences);
        },

        /**
         * Given a server and "new" alias, resolve this alias to the user's 
         * new primary name and move profile data pertaining to the alias to 
         * the new primary name.
         */
        'renameProfile': function(server, alias){
            if(!_.has(this.profiles, server)) return;
            var profiles = dbot.db.profiles[server];

            if(_.has(profiles, alias)){
                var primary = dbot.api.users.resolveUser(server, alias, true);
                var primaryLower = primary.toLowerCase();
                alias = alias.trim().toLowerCase();

                profiles[primaryLower] = profiles[alias];
                profiles[primaryLower].profile.primary = primary;
                delete profiles[alias];
            }
        },

        /**
         * Given a server and a primary username which has been converted to a
         * secondary alias find and remove the profile for the alias.
         */
        'mergeProfile': function(server, mergeFromPrimary){
            if(!_.has(this.profiles, server)) return;
            var profiles = dbot.db.profiles[server];

            mergeFromPrimary = mergeFromPrimary.toLowerCase();
            var mergeToPrimary = dbot.api.users.resolveUser(server, mergeFromPrimary, true).toLowerCase();
            if(!_.has(profiles, mergeToPrimary)
                    || !_.has(profiles, mergeFromPrimary)) return;

            // Remove the profile of the alias
            delete profiles[mergeFromPrimary];
        },
    }
};

exports.fetch = function(dbot) {
    return api(dbot);
};
