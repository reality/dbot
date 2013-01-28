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
                console.log(primary);
                api.createProfile(serverName, primary);
            });
        });
        dbot.save();
        
        // Add API Hooks
        dbot.api.command.addHook('~setaliasparent', this.api.renameProfile);
        dbot.api.command.addHook('~mergeusers', this.api.mergeProfile);
    };
};

exports.fetch = function(dbot) {
    return new profile(dbot);
};
