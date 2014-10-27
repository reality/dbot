var _ = require('underscore')._;

var profile = function(dbot) {

    this.onLoad = function(){
        var schema = this.config.schema;

        // Add API Hooks
        dbot.api.event.addHook('new_user', this.api.createProfile);

        dbot.instance.addPreEmitHook(function(event, callback) {
            if(!event.rUser) return callback();
            this.api.getProfileByUser(event.rUser, function(uProfile) {
                if(uProfile) {
                    event.rProfile = uProfile.profile;
                }             
                callback();
            }.bind(this));
        }.bind(this));

        //TODO(@samstudio8) Profile Merging
        //dbot.api.command.addHook('~mergeusers', this.api.mergeProfile);
    };
};

exports.fetch = function(dbot) {
    return new profile(dbot);
};
