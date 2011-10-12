var kick = function(dbot) {
    var dbot = dbot;

    return {
        'listener': function(data) {
           if(data.kickee == dbot.name) {
                dbot.instance.join(data.channel);
                dbot.say(data.channel, 'Thou shalt not kick ' + dbot.name);
                dbot.db.kicks[dbot.name] += 1;
            } else {
                if(!dbot.db.kicks.hasOwnProperty(data.kickee)) {
                    dbot.db.kicks[data.kickee] = 1;
                } else {
                    dbot.db.kicks[data.kickee] += 1;
                }

                if(!dbot.db.kickers.hasOwnProperty(data.user)) {
                    dbot.db.kickers[data.user] = 1; 
                } else {
                    dbot.db.kickers[data.user] += 1;
                }

                dbot.say(data.channel, data.kickee + '-- (' + data.kickee + ' has been kicked ' + dbot.db.kicks[data.kickee] + ' times)');
            }
        },

        on: 'KICK'
    };
};

exports.fetch = function(dbot) {
    return kick(dbot);
};
