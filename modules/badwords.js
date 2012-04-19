// Find which badwords are currently enacted in the current channel
var badwords = function(dbot) {
    var name = 'badwords';
    var dbot = dbot;
    var badWordLock = false;

    var commands = {
        '~badwords': function(data, params) {
            if(badWordLock == true) {
                dbot.say('reality', 'Another badwords query is in action. Try again in a few seconds.');
            } else {
                data.channel = '#42';
                badWordLock = true;

                dbot.db.sessionData.badwords.finished = false;

                dbot.say('bots', 'badwords ' + data.channel + ' list');
                dbot.instance.addListener('PRIVMSG', function(data) {
                    if(data.channel === 'bots') {
                        if(data.message.indexOf('bad words list is empty') != -1) {
                            dbot.db.sessionData.badwords.count = 0;
                            dbot.db.sessionData.badwords.finished = true;
                        } else {
                            var wordMatch = data.message.valMatch(/\w([1-10])\w(.*)/, 2);
                            dbot.say('reality', wordMatch[1]);
                        }
                    }
                });

                dbot.db.sessionData.badwords = {};
                badWordLock = false;
            }
        }
    };

    return {
        'onLoad': function(data) {
            if(dbot.db.sessionData.hasOwnProperty('badwords')) {
                dbot.db.sessionData.badwords = {};
            }

            return commands;
        },

        'name': name,

        'ignorable': true
    };
};

exports.fetch = function(dbot) {
    return badwords(dbot);
};
