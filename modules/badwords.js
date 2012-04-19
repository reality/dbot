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

                dbot.sessionData.badwords.finished = false;

                dbot.say('bots', 'badwords ' + data.channel + ' list');
                dbot.instance.addListener('PRIVMSG', function(data) {
                    if(data.channel === 'bots') {
                        if(data.message.indexOf('bad words list is empty') != -1) {
                            dbot.sessionData.badwords.count = 0;
                            dbot.sessionData.badwords.finished = true;
                        } else {
                            var wordMatch = data.message.valMatch(/\w([1-10])\w(.*)/, 2);
                            dbot.say('reality', wordMatch[1]);
                        }
                    }
                });

                dbot.sessionData.badwords = {};
                badWordLock = false;
            }
        }
    };

    return {
        'onLoad': function() {
            if(!dbot.sessionData.hasOwnProperty('badwords')) {
                dbot.sessionData.badwords = {};
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
