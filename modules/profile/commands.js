var _ = require('underscore')._;

var commands = function(dbot){
    var commands = {

        "~getprop": function(event){
            if(event.params[1]){
                var primary = dbot.api.users.resolveUser(event.server, event.user);
                var res = dbot.db.profiles[event.server][primary.toLowerCase()].profile[event.params[1]];
                if(res){
                    event.reply(res);
                }
                else{
                    event.reply("Nope.");
                }
            }
        },

        "~setprop": function(event){
            if(event.input[1] && event.input[2]){
                if(_.has(this.config.schema.profile, event.input[1])){
                    var primary = dbot.api.users.resolveUser(event.server, event.user);
                    dbot.db.profiles[event.server][primary.toLowerCase()].profile[event.input[1]] = event.input[2];
                    event.reply("Property set, maybe?");
                }
                else{
                    event.reply("Invalid property. Go home.");
                }
            }
        },

        "~profile": function(event){
            if(event.params[1]){
                var primary = dbot.api.users.resolveUser(event.server, event.params[1]);
                if(_.has(dbot.db.profiles[event.server], primary.toLowerCase())){
                    event.reply(dbot.api.web.getUrl("profile/"+event.server+"/"+primary.toLowerCase()));
                }
                else{
                    event.reply("No profile found for "+event.params[1]);
                }
            }
            else{
                event.message = '~profile ' + event.user;
                event.action = 'PRIVMSG';
                event.params = event.message.split(' ');
                dbot.instance.emit(event);
            }
        }
    };
    commands['~setprop'].regex = [/~setprop ([^ ]+) (.+)/, 3];

    return commands;
};

exports.fetch = function(dbot){
    return commands(dbot);
};
