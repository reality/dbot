var puns = function(dbot) {
    var dbot = dbot;

    return {
        'listener': function(data) {
            if(data.user == 'Lamp') {
                dbot.say(data.channel, dbot.db.quoteArrs.lamp.random());
            } else if(data.user == 'reality') {
                dbot.instance.say(data.channel, dbot.db.realiPuns.random());
            } else if(dbot.instance.inChannel(data.channel)) {
                dbot.instance.say('aisbot', '.karma ' + data.user);
                dbot.waitingForKarma = data.channel;
            }
        },

        'on': 'JOIN'
    };
}

exports.fetch = function(dbot) {
    return puns(dbot);
};
