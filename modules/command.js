// Module which handles the command execution syntax for DBot. Not much is going
// to work without this.
var command = function(dbot) {
    var dbot = dbot;

    return {
        'onLoad': function() {
            return {
                '~ignore': function(data, params) {
                    var ignorableModules = [];
                    for(var i=0;i<dbot.modules.length;i++) {
                        if(dbot.modules[i].ignorable != null && dbot.modules[i].ignorable == true) {
                            ignorableModules.push(dbot.modules[i].name);
                        }
                    }

                    var usageString = 'Usage: ~ignore [module]. Modules you can ignore are: ';
                    for(var i=0;i<ignorableModules.length;i++) {
                        usageString += ignorableModules[i] + ", ";
                    }
                    usageString = usageString.slice(0, -2) + '.';

                    if(params[1] == undefined) {
                        dbot.say(data.channel, data.user + ': ' + usageString);
                    } else {
                        if(dbot.moduleNames.include(params[1])) {
                            if(!dbot.db.ignores.hasOwnProperty(data.user)) {
                                dbot.db.ignores[data.user] = [];
                            }

                            if(dbot.db.ignores[data.user].include(params[1])) {
                                dbot.say(data.channel, data.user + ': You\'re already ignoring that module.');
                            } else {
                                dbot.db.ignores[data.user].push(params[1]);
                                dbot.say(data.channel, data.user + ': Now ignoring ' + params[1]);
                            }
                        } else {
                            dbot.say(data.channel, data.user + ': That isn\'t a valid module name. ' + 
                                usageString);
                        }
                    }
                }, 

                '~unignore': function(data, params) {
                    var ignoredModules = [];
                    if(dbot.db.ignores.hasOwnProperty(data.user)) {
                        ignoredModules = dbot.db.ignores[data.user];
                    }

                    var usageString = 'Usage: ~unignore [module]. Modules you are currently ignoring: ';
                    if(ignoredModules.length == 0) {
                        usageString += 'None.';
                    } else {
                        for(var i=0;i<ignoredModules.length;i++) {
                            usageString += ignoredModules[i] + ", ";
                        }
                        usageString = usageString.slice(0, -2) + '.';
                    }

                    if(params[1] == undefined) {
                        dbot.say(data.channel, data.user + ': ' + usageString);
                    } else {
                        if(ignoredModules.include(params[1]) == false) {
                            dbot.say(data.channel, data.user + 
                                    ': You\'re not ignoring that module or it doesn\'t exist. ' + usageString);
                        } else {
                            dbot.db.ignores[data.user].splice(dbot.db.ignores[data.user].indexOf(params[1]), 1);
                            dbot.say(data.channel, data.user + ': No longer ignoring ' + params[1]);
                        }
                    }
                }
            };
        },

        'listener': function(data) {
            var params = data.message.split(' ');
            if(data.channel == dbot.name) data.channel = data.user;
    
            if(dbot.commands.hasOwnProperty(params[0])) {
                if((dbot.db.bans.hasOwnProperty(params[0]) && 
                        dbot.db.bans[params[0]].include(data.user)) || dbot.db.bans['*'].include(data.user)) {
                    dbot.say(data.channel, data.user + 
                        ' is banned from using this command. Commence incineration.'); 
                } else {
                    var commandBelongsTo = dbot.commandMap[params[0]];
                    if(dbot.db.ignores.hasOwnProperty(data.user) && 
                            dbot.db.ignores[data.user].include(commandBelongsTo)) {
                        // do nothing
                    } else {
                        dbot.commands[params[0]](data, params);
                        dbot.save();
                    }
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
                        if(dbot.db.quoteArrs.hasOwnProperty(key) && dbot.moduleNames.include('quotes')) {
                            var params = ['~q'];
                            key.split(' ').each((function(word) {
                                this.push(word);
                            }).bind(params));
                            data.message = params.join(' ');
                            dbot.commands[params[0]](data, params);
                            dbot.save();
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

        'on': 'PRIVMSG',

        'name': 'command',

        'ignorable': false
    };
};

exports.fetch = function(dbot) {
    return command(dbot);
};

