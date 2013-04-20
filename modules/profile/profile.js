var _ = require('underscore')._;

var profile = function(dbot) {

    this.onLoad = function(){
        var api = this.api;
        var schema = this.config.schema;

        // Add API Hooks
        dbot.api.command.addHook('~setaliasparent', this.api.renameProfile);
        //TODO(@samstudio8) Profile Merging
        //dbot.api.command.addHook('~mergeusers', this.api.mergeProfile);
        dbot.api.event.addHook('new_user', this.api.createProfile);
    };
};

exports.fetch = function(dbot) {
    return new profile(dbot);
};
