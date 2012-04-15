var youAre = function(dbot) {
    var name = 'youare';

    return {
        'listener': function(data) {
            if((dbot.db.ignores.hasOwnProperty(data.user) && 
                        dbot.db.ignores[data.user].include(name)) == false) {
                var key = data.message.valMatch(/(\bis\b|\bare\b)\s+([\w\s\d]*?)(\s+)?(,|\.|\band\b|$)/, 5);

                if(key && key[2] != "" && Number.prototype.chanceIn(1, 100) && data.user != 'aisbot') {
                    dbot.say(data.channel, data.user + ': You\'re ' + key[2] + '.');
                }
            }
        },

        'on': 'PRIVMSG',

        'name': name,

        'ignorable': false
    };
};

exports.fetch = function(dbot) {
    return youAre(dbot);
};
