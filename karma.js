var karma = function(dbot) {
    var dbot = dbot;

    return {
        'listener': function(data) {
            if(data.user == 'aisbot' && data.channel == 'aisbot' &&
                    dbot.waitingForKarma != false && data.message.match(/is at/)) {
                var split = data.message.split(' ');
                var target = split[0];
                var karma = split[3];

                if(karma.startsWith('-')) {
                    dbot.say(dbot.waitingForKarma, target + dbot.db.hatedPhrases.random() + ' (' + karma + ')');
                } else if(karma == '0') {
                    dbot.say(dbot.waitingForKarma, target + dbot.db.neutralPhrases.random() + ' (0)');
                } else {
                    dbot.say(dbot.waitingForKarma, target + dbot.db.lovedPhrases.random() + ' (' + karma + ')');
                }

                dbot.waitingForKarma = false;
            }
        },

        'on': 'PRIVMSG'
    }
};

exports.fetch = function(dbot) {
    return karma(dbot);
};
