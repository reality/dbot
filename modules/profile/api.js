var _ = require('underscore')._;

var api = function(dbot) {
    return {

        /**
         * Create a profile for a new primary user on a given server.
         * If the server does not already exist, create it.
         */
        "createProfile": function(server, primary){
            if(!_.has(this.profiles, server)){
                this.profiles[server] = {};
            }
            this.profiles[server][primary] = {};
            _.defaults(this.profiles[server][primary], this.config.schema);
        },
    }
};

exports.fetch = function(dbot) {
    return api(dbot);
};
