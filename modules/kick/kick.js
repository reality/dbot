var _ = require('underscore')._;

var kick = function(dbot) {
    
    this.api = {
        'ban': function(server, user, channel) {
            dbot.instance.connections[server].send('MODE ' + channel + ' +b ' + user + '!*@*');
        },

        'kick': function(server, user, channel, msg) {
            dbot.instance.connections[server].send('KICK ' + channel + ' ' + user + ' :' + msg);
        }
    };
    
    this.listener = function(event) {
       if(event.kickee == dbot.config.name) {
            dbot.instance.join(event, event.channel);
            event.reply(dbot.t('kicked_dbot', { 'botname': dbot.config.name }));
            dbot.db.kicks[dbot.config.name] += 1;
        } else {
            if(!_.has(dbot.db.kicks, event.kickee)) {
                dbot.db.kicks[event.kickee] = 1;
            } else {
                dbot.db.kicks[event.kickee] += 1;
            }

            if(!_.has(dbot.db.kickers, event.user)) {
                dbot.db.kickers[event.user] = 1; 
            } else {
                dbot.db.kickers[event.user] += 1;
            }

            if(!this.config.countSilently) {
                event.reply(event.kickee + '-- (' + dbot.t('user_kicks', {
                    'user': event.kickee, 
                    'kicks': dbot.db.kicks[event.kickee], 
                    'kicked': dbot.db.kickers[event.kickee]
                }) + ')');
            }
        }
    }.bind(this);
    this.on = 'KICK';
};

exports.fetch = function(dbot) {
    return new kick(dbot);
};
