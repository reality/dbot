var _ = require('underscore')._;

var profile = function(dbot) {

    this.onLoad = function(){
        var schema = this.config.schema;

        // Ensure all users have a profile
        dbot.api.users.getAllUsers(function(users){
            if(users){ 
                _.each(users, function(user){
                    this.api.getProfileByUUID(user.id, function(err, uuid, profile){
                        // If function returns an error and uuid, create a new profile
                        if(err && uuid){
                            this.api.createProfile(user);
                        }
                    }.bind(this));
                }.bind(this));
            }
        }.bind(this));

        // Add API Hooks
        dbot.api.event.addHook('new_user', this.api.createProfile);

        //TODO(@samstudio8) Profile Merging
        //dbot.api.command.addHook('~mergeusers', this.api.mergeProfile);
    };
};

exports.fetch = function(dbot) {
    return new profile(dbot);
};
