var _ = require('underscore')._;

var commands = function(dbot){
    var commands = {
        '~get': function(event){
            if(event.params[1]){
                if(_.has(this.config.schema.profile, event.params[1])){
                    this.api.getProperty(event.server, event.user, event.params[1], function(reply){
                        event.reply(reply);
                    });
                } else {
                    event.reply('Invalid property. Go home.');
                }
            }
        },

        '~set': function(event){
            if(event.input[1] && event.input[2]){
                if(_.has(this.config.schema.profile, event.input[1])){
                    this.api.setProperty(event.server, event.user, event.input[1], event.input[2], function(reply){
                        event.reply(reply);
                    });
                } else {
                    event.reply('Invalid property. Go home.');
                }
            }
        },

        '~profile': function(event) {
            var user = event.params[1] || event.user;
            event.reply(dbot.api.web.getUrl('profile/' + event.server + '/' + user));
        }
    };
    commands['~set'].regex = [/set ([^ ]+) (.+)/, 3];

    return commands;
};

exports.fetch = function(dbot){
    return commands(dbot);
};
