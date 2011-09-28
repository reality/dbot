var puns = function(dbot) {
    var dbot = dbot;

    return {
        'listener': function(data) {
            if(data.user == 'reality') {
                dbot.instance.say(data.channel, dbot.db.quoteArrs['realityonce'].random());
            } else if(dbot.db.quoteArrs.hasOwnProperty(data.user.toLowerCase())) {
                dbot.say(data.channel, data.user + ': ' + dbot.db.quoteArrs[data.user.toLowerCase()].random());
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
