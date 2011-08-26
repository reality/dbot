var userCommands = function(dbot) {
    var dbot = dbot;

    var commands = {
        '~kc': function(data, params) {
            dbot.say('aisbot', '.karma ' + data.message.split(' ')[1]);
            dbot.waitingForKarma = data.channel;
        },

        '~q': function(data, params) {
            var q = data.message.valMatch(/^~q ([\d\w\s]*)/, 2)
            if(q) {
                dbot.say(data.channel, dbot.quotes.get(q[1].trim()));
            }
        },

        '~qadd': function(data, params) {
            var q = data.message.valMatch(/^~qadd ([\d\w\s]*)=(.+)$/, 3);
            if(q) {
                dbot.say(data.channel, dbot.quotes.add(q));
            } else {
                dbot.say(data.channel, 'Burn the invalid syntax!');
            }
        },

        '~qset': function(data, params) {
            var q = data.message.valMatch(/^~qset ([\d\w\s]*)=(.+)$/, 3);
            if(q) {
                dbot.say(data.channel, dbot.quotes.set(q));
            } else {
                dbot.say(data.channel, 'Burn the invalid syntax!');
            }
        },

        '~qcount': function(data, params) {
            var q = data.message.valMatch(/^~qcount ([\d\w\s]*)/, 2);
            if(q) {
                dbot.say(data.channel, dbot.quotes.count(q[1].trim()));
            }
        },

        '~reality': function(data, params) {
            dbot.say(data.channel, dbot.db.realiPuns.random());
        },

        '~d': function(data, params) {
            dbot.say(data.channel,  data.user + ': ' + dbot.db.quoteArrs['depressionbot'].random());
        },

        '~rq': function(data, params) {
            dbot.say(data.channel, dbot.quotes.random());
        },

        '~kickcount': function(data, params) {
            if(!dbot.db.kicks.hasOwnProperty(params[1])) {
                dbot.say(data.channel, params[1] + ' has either never been kicked or does not exist.');
            } else {
                dbot.say(data.channel, params[1] + ' has been kicked ' + dbot.db.kicks[params[1]] + ' times.');
            }
        }
    };

    return {
        'listener': function(data) {
            params = data.message.split(' ');
            if(data.channel == dbot.name) data.channel = data.user;

            if(commands.hasOwnProperty(params[0])) {
                commands[params[0]](data, params);
                dbot.save();
            } else {
                var q = data.message.valMatch(/^~([\d\w\s]*)/, 2)
                if(q) {
                    dbot.say(data.channel, dbot.quotes.get(q[1].trim()));
                }
            }
        },

        'on': 'PRIVMSG'
    };
};

exports.fetch = function(dbot) {
    return userCommands(dbot);
};
