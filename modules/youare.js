var youAre = function(dbot) {
    var dbot = dbot;

    return {
        'listener': function(data) {
            var key = data.message.valMatch(/(\bis\b|\bare\b)\s+([\w\s\d]*?)(\s+)?(,|\.|\band\b|$)/, 5);

            if(key && key[2] != "" && Number.prototype.chanceIn(1, 10) && data.user != 'aisbot') {
                dbot.say(data.channel, data.user + ': You\'re ' + key[2] + '.');
            }
        },

        'on': 'PRIVMSG'
    };
};

exports.fetch = function(dbot) {
    return youAre(dbot);
};
