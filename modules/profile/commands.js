var _ = require('underscore')._;

var commands = function(dbot){
    return {

        "~test_getprop": function(event){
            if(event.params[1]){
                var res = dbot.db.profiles[event.server][event.user.toLowerCase()].profile[event.params[1]];
                if(res){
                    event.reply(res);
                }
                else{
                    event.reply("Nope.");
                }
            }
        },

        "~test_setprop": function(event){
            if(event.params[1] && event.params[2]){
                dbot.db.profiles[event.server][event.user.toLowerCase()].profile[event.params[1]] = event.params[2];
            }
        }
    }
};

exports.fetch = function(dbot){
    return commands(dbot);
};
