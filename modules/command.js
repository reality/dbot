// Module which handles the command execution syntax for DBot. Not much is going
// to work without this.
var command = function(dbot) {
    var dbot = dbot;

    return {
        'listener': function(data) {
            params = data.message.split(' ');
            if(data.channel == dbot.name) data.channel = data.user;

            if(dbot.commands.hasOwnProperty(params[0])) {
                if((dbot.db.bans.hasOwnProperty(params[0]) && 
                        dbot.db.bans[params[0]].include(data.user)) || dbot.db.bans['*'].include(data.user))
                    dbot.say(data.channel, data.user + 
                        ' is banned from using this command. Commence incineration.'); 
                else {
                    dbot.commands[params[0]](data, params);
                    dbot.save();
                }
            } else {
                var q = data.message.valMatch(/^~([\d\w\s-]*)/, 2);
                if(q) {
                    if(dbot.db.bans['*'].include(data.user)) {
                        dbot.say(data.channel, data.user + 
                            ' is banned from using this command. Commence incineration.'); 
                    } else {
                        q[1] = q[1].trim();
                        key = dbot.cleanNick(q[1])
                        if(dbot.db.quoteArrs.hasOwnProperty(key)) {
                            dbot.say(data.channel, q[1] + ': ' + dbot.interpolatedQuote(key));
                        } else {
                            // See if it's similar to anything
                            var winnerDistance = Infinity;
                            var winner = false;
                            for(var commandName in dbot.commands) {
                                var distance = String.prototype.distance(params[0], commandName);
                                if(distance < winnerDistance) {
                                    winner = commandName;
                                    winnerDistance = distance;
                                }
                            }

                            if(winnerDistance < 3) {
                                dbot.say(data.channel, 'Did you mean ' + winner + '? Learn to type, hippie!');
                            }
                        }
                    }
                }
            }
        },

        'on': 'PRIVMSG'
    };
};

exports.fetch = function(dbot) {
    return command(dbot);
};

