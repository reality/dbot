var youAre = function(dbot) {
    var dbot = dbot;

    return {
        'listener': function(data) {
            var key = data.message.match(/(\bis\b|\bare\b)\s+([\w\s\d]*?)(\s+)?(,|\.|\band\b|$)/);

            if(key && Number.prototype.chanceIn(1, 3)) {
                dbot.say(data.channel, data.user + ': You\'re ' + key[2]);
            }
        },

        'on': 'PRIVMSG'
    };
};

exports.fetch = function(dbot) {
    return youAre(dbot);
};
