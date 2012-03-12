// Module which handles the command execution syntax for DBot. Not much is going
// to work without this.
var command = function(dbot) {
    var dbot = dbot;

    var ignoreCommands = function (data, params) {
        if(data.channel == dbot.name) data.channel = data.user;
        var targetCommand = params[1];
        var ignoreMins = parseFloat(params[2]);

        if(!dbot.sessionData.hasOwnProperty("ignoreCommands")) {
            dbot.sessionData.ignoreCommands = {};
        }
        if(!dbot.sessionData.ignoreCommands.hasOwnProperty(targetCommand)) {
            dbot.sessionData.ignoreCommands[targetCommand] = [];
        }

        if(dbot.sessionData.ignoreCommands[targetCommand].include(data.channel)) {
            dbot.say(data.channel, "Already ignoring '" + targetCommand + "' in '" + data.channel + "'.");
        } else {
            dbot.sessionData.ignoreCommands[targetCommand].push(data.channel);
            dbot.timers.addOnceTimer(ignoreMins * 60 * 1000, function() {
                dbot.sessionData.ignoreCommands[targetCommand].splice(dbot.sessionData.ignoreCommands[targetCommand].indexOf(data.channel), 1);
                dbot.say(data.channel, "No longer ignoring '" + targetCommand + "' in '" + data.channel + "'.");
            });
            dbot.say(data.channel, "Ignoring '" + targetCommand + "' in '" + data.channel + "' for the next " + ignoreMins + " minute" + (ignoreMins == 1 ? "" : "s") + ".");
        }
    };

    return {
        'onLoad': function() {
            return {
                '~ignore': ignoreCommands
            };
        },
        'listener': function(data) {
            params = data.message.split(' ');
            if(data.channel == dbot.name) data.channel = data.user;

            var ignoringCommand = false;
            if(dbot.sessionData.hasOwnProperty("ignoreCommands")) {
                if(dbot.sessionData.ignoreCommands.hasOwnProperty(params[0])) {
                    if(dbot.sessionData.ignoreCommands[params[0]].include(data.channel)) {
                        ignoringCommand = true;
                    }
                }
            }

            if(dbot.commands.hasOwnProperty(params[0])) {
                if((dbot.db.bans.hasOwnProperty(params[0]) && 
                        dbot.db.bans[params[0]].include(data.user)) || dbot.db.bans['*'].include(data.user)) {
                    dbot.say(data.channel, data.user + 
                        ' is banned from using this command. Commence incineration.'); 
                } else if(ignoringCommand) {
                    // do nothing, this stops us falling through to the non-command stuff
                } else {
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

