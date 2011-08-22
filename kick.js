var kick = function(dbot) {
    return {
        'listener': function(data) {
           if(data.kickee == dbot.name) {
                dbot.instance.join(data.channel); // make interface
                dbot.say(data.channel, 'Thou shalt not kick ' + dbot.name);
                dbot.db.kicks[name] += 1;
            } else {
                if(dbot.db.kicks[data.kickee] == undefined) {
                    dbot.db.kicks[data.kickee] = 1;
                } else {
                    dbot.db.kicks[data.kickee] += 1;
                }
                instance.say(data.channel, data.kickee + '-- (' + data.kickee + ' has been kicked ' + dbot.db.kicks[data.kickee] + ' times)');
            }

            dbot.save();
        },

        on: 'KICK'
    };
};

exports.fetch = function(dbot) {
    return kick(dbot);
};
