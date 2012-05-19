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

                    if(params[1] == undefined) {
                        dbot.say(data.channel, 
                                dbot.t('ignore_usage', {'user': data.user, 'modules': ignorableModules.join(', ')}));
                    } else {
                        if(dbot.moduleNames.include(params[1])) {
                            if(!dbot.db.ignores.hasOwnProperty(data.user)) {
                                dbot.db.ignores[data.user] = [];
                            }

                            if(dbot.db.ignores[data.user].include(params[1])) {
                                dbot.say(data.channel, dbot.t('already_ignoring', {'user': data.user}));
                            } else {
                                dbot.db.ignores[data.user].push(params[1]);
                                dbot.say(data.channel, dbot.t('ignored', {'user': data.user, 'module': params[1]}));
                            }
                        } else {
                            dbot.say(data.channel, dbot.t('invalid_ignore', {'user': data.user}));
                        }
                    }
                }, 

                '~unignore': function(data, params) {
                    var ignoredModules = [];
                    if(dbot.db.ignores.hasOwnProperty(data.user)) {
                        ignoredModules = dbot.db.ignores[data.user];
                    }

                    if(params[1] == undefined) {
                        dbot.say(data.channel, 
                                dbot.t('unignore_usage', {'user': data.user, 'modules': ignoredModules.join(', ')}));
                    } else {
                        if(ignoredModules.include(params[1]) == false) {
                            dbot.say(data.channel, dbot.t('invalid_unignore', {'user': data.user}));
                        } else {
                            dbot.db.ignores[data.user].splice(dbot.db.ignores[data.user].indexOf(params[1]), 1);
                            dbot.say(data.channel, dbot.t('unignored', {'user': data.user, 'module': params[1]}));
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
                    dbot.say(data.channel, dbot.t('command_ban', {'user': data.user})); 
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
                        dbot.say(data.channel, dbot.t('command_ban', {'user': data.user})); 
                    } else {
                        q[1] = q[1].trim();
                        key = dbot.cleanNick(q[1])
                        if(dbot.db.quoteArrs.hasOwnProperty(key) && dbot.moduleNames.include('quotes') &&
                                (dbot.db.ignores.hasOwnProperty(data.user) && 
                                 dbot.db.ignores[data.user].include('quotes')) == false) {
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
                                dbot.say(data.channel, dbot.t('command_typo', {'command': winner}));
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

