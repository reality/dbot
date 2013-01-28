var _ = require('underscore')._;

var profile = function(dbot) {

    this.profiles = dbot.db.profiles;

    /**
     * Iterate over known user profiles and ensure they contain all the 
     * required properties as defined in the configuation.
     */
    this.onLoad = function(){
        var api = this.api;
        var schema = this.config.schema;

        // Ensure all known users have a profile
        _.each(dbot.api.users.getAllUsers(), function(server, serverName){
            _.each(server, function(primary, primaryi){
                api.createProfile(serverName, primary);
            });
        });
        dbot.save();
        
        // Add API Hooks
        dbot.api.command.addHook('~setaliasparent', this.api.renameProfile);
        dbot.api.command.addHook('~mergeusers', this.api.mergeProfile);
        dbot.api.event.addHook('new_user', this.api.createProfile);
    };
};

exports.fetch = function(dbot) {
    return new profile(dbot);
};
