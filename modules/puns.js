var puns = function(dbot) {
    var dbot = dbot;

    return {
        'listener': function(data) {
            if(data.user == 'reality') {
                dbot.instance.say(data.channel, dbot.interpolatedQuote('realityonce'));
            } else if(dbot.db.quoteArrs.hasOwnProperty(data.user.toLowerCase())) {
                dbot.say(data.channel, data.user + ': ' + dbot.interpolatedQuote(data.user.toLowerCase()));
            }
        },

        'on': 'JOIN'
    };
}

exports.fetch = function(dbot) {
    return puns(dbot);
};
