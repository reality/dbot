var youAre = function(dbot) {
    var name = 'youare';

    return {
        'listener': function(event) {
            if((dbot.db.ignores.hasOwnProperty(event.user) && 
                        dbot.db.ignores[event.user].include(name)) == false) {
                var key = event.message.valMatch(/(\bis\b|\bare\b)\s+([\w\s\d]*?)(\s+)?(,|\.|\band\b|$)/, 5);

                if(key && key[2] != "" && Number.prototype.chanceIn(1, 100) && event.user != 'aisbot') {
                    event.reply(event.user + ': You\'re ' + key[2] + '.');
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
