var _ = require('underscore')._;

var commands = function(dbot) {
    var commands = {
        '~lines': function(event) {
            if(event.params[1]) {
                dbot.api.users.resolveUser(event.server, event.user, function(user) {
                    if(user) { // I disgust me
                        event.rUser = user;
                        delete event['params'];
                        commands['~lines'](event);
                    } else {
                        event.reply(dbot.t('sstats_unknown_user'));
                    }
                });
            } else {
                this.api.getUserStats(event.rUser.id, function(uStats) {
                    if(uStats) {
                        var output = dbot.t('sstats_tlines', { 
                            'user': event.rUser.primaryNick,
                            'lines': uStats.lines 
                        });
                        if(event.rChannel && _.has(uStats.channels, event.rChannel.id)) {
                            output += dbot.t('sstats_uclines', { 
                                'channel': event.channel,
                                'lines': uStats.channels[event.rChannel.id].lines 
                            });
                        }
                        event.reply(output);
                    } else {
                        event.reply(dbot.t('sstats_noustats'));
                    }
                });       
            }
        },

        '~clines': function(event) {
            if(!event.cStats) return;
            event.reply(dbot.t('sstats_clines', { 
                'channel': event.channel, 
                'lines': event.cStats.lines 
            }));
        }
    };
    return commands;
};

exports.fetch = function(dbot) {
    return commands(dbot);
};
