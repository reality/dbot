var _ = require('underscore')._,
    moment = require('moment-timezone');

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
                    if(event.input[1] === 'timezone') { // eugh
                        if(moment.tz.zone(event.input[2]) !== null) {
                            this.api.setProperty(event.server, event.user, event.input[1], event.input[2], function(reply){
                                event.reply(reply);
                            });
                        } else {
                            event.reply('Invalid timezone! See the pretty graph here: http://momentjs.com/timezone/');
                        }
                    } else {
                        this.api.setProperty(event.server, event.user, event.input[1], event.input[2], function(reply){
                            event.reply(reply);
                        });
                    }
                } else {
                    event.reply('Invalid property. Go home.');
                }
            }
        },

        '~profile': function(event) {
            var user = event.params[1] || event.user;
            event.reply(dbot.api.web.getUrl('profile/' + event.server + '/' + user));
        },

        '~time': function(event) {
            dbot.api.profile.getProfile(event.server, event.params[1], function(err, user, profile) {
                if(!err) {
                    var tz = profile.profile.timezome;
                    if(tz) {
                        event.reply('The time for ' + event.params[1] + ' is ' + moment().tz(tz).format('HH:mm:ss on DD/MM/YYYY'));
                    } else {
                        event.reply(user.currentNick + ' needs to set a timezone with ~timezone');
                    }
                } else {
                    if(!user) {
                        event.reply('No idea who that is mate');
                    } else {
                        event.reply(user.currentNick + ' needs to set a timezone with ~timezone');
                    }
                }
            });
        }
    };
    commands['~set'].regex = [/set ([^ ]+) (.+)/, 3];

    return commands;
};

exports.fetch = function(dbot){
    return commands(dbot);
};
