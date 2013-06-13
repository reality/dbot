var _ = require('underscore')._;

var api = function(dbot) {
    return {

        /**
         * Create a new profile for a given "databanked" user.
         * Typically only called as a hook to the new_user emit event.
         * TODO(@samstudio8) Migrate to internalAPI
         */
        "createProfile": function(user, callback){
            if(user){
                this.db.create('profiles', user.id, {
                    'id': user.id,
                    'profile': this.config.schema.profile,
                    'preferences': this.config.schema.preferences
                }, function(err, result){
                    if(err){
                        console.log(err);
                    }
                });
            }
        },
  
        //TODO(samstudio8) Merge Profiles
        'mergeProfile': function(server, nick, callback){
            console.log("mergeProfile not implemented");
        },

        'getProfile': function(server, nick, callback){
            dbot.api.users.resolveUser(server, nick, function(user){
                if(user){
                    this.db.read('profiles', user.id, function(err, profile){
                        if(!err){
                            callback(false, user, profile);
                        }
                        else{
                            callback(true, user, null);
                        }
                    });
                }
                else{
                    callback(true, null, null);
                }
            }.bind(this));
        },

        'getProfileByUUID': function(uuid, callback){
            if(uuid){
                this.db.read('profiles', uuid, function(err, profile){
                    if(!err){
                        callback(false, uuid, profile);
                    }
                    else{
                        callback(true, uuid, null);
                    }
                });
            }
            else{
                callback(true, null, null);
            }
        },

        'getAllProfiles': function(callback){
            var profiles = [];
            this.db.scan('profiles', function(profile){
                profiles.push(profile);
            }, function(err){
                if(!err){
                    callback(profiles);
                }
                else{
                    console.log(err);
                }
            });
        },

        'setProperty': function(server, nick, field, value, callback){
            this.api.getProfile(server, nick, function(err, user, profile){
                if(!err){
                    profile.profile[field] = value;
                    this.db.save('profiles', user.id, profile, function(err){
                        if(!err){
                            callback("Ok!");
                        }
                    });
                }
            }.bind(this));
        },

        'getProperty': function(server, nick, field, callback){
            this.api.getProfile(server, nick, function(err, user, profile){
                if(!err){
                    if(profile.profile[field]){
                        callback(profile.profile[field]);
                    }
                }
            }.bind(this));
        },
    }
};

exports.fetch = function(dbot) {
    return api(dbot);
};
