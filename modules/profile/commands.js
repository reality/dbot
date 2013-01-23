var _ = require('underscore')._;

var commands = function(dbot){
    var cmds = {

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
            if(event.input[1] && event.input[2]){
                if(_.has(this.config.schema.profile, event.input[1])){
                    dbot.db.profiles[event.server][event.user.toLowerCase()].profile[event.input[1]] = event.input[2];
                    event.reply("Property set, maybe?");
                }
                else{
                    event.reply("Invalid property. Go home.");
                }
            }
        }
    };
    cmds['~test_setprop'].regex = [/~test_setprop ([^ ]+) (.+)/, 3];

    return cmds;
};

exports.fetch = function(dbot){
    return commands(dbot);
};
