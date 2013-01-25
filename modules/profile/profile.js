var _ = require('underscore')._;

var profile = function(dbot) {

    this.profiles = dbot.db.profiles;

    /**
     * Iterate over known user profiles and ensure they contain all the 
     * required properties as defined in the configuation.
     */
    this.onLoad = function(){
        var schema = this.config.schema;

        // Ensure all known users have a profile
        _.each(dbot.api.users.getAllUsers(), function(server, serverName){
            if(!_.has(dbot.db.profiles, serverName)){
                dbot.db.profiles[serverName] = {}
            }
            _.each(server, function(userName){
                var primary = userName;
                userName = userName.toLowerCase();
                // TODO why isn't this calling the profile create API function
                if(!_.has(dbot.db.profiles[serverName], userName)){
                    dbot.db.profiles[serverName][userName] = {
                        "profile": {},
                        "preferences": {}
                    };
                }
                //TODO(samstudio8) Currently only handles "top-level"
                _.defaults(dbot.db.profiles[serverName][userName].profile, schema.profile);
                _.defaults(dbot.db.profiles[serverName][userName].preferences, schema.preferences);
                dbot.db.profiles[serverName][userName].profile.primary = primary;
            });
        });
        dbot.save();
    };
};

exports.fetch = function(dbot) {
    return new profile(dbot);
};
