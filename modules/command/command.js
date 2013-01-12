/**
 * Module Name: Command
 * Description: An essential module which maps PRIVMSG input to an appropriate
 * command and then runs that command, given the user isn't banned from or
 * ignoring that command.
 */
var _ = require('underscore')._;
var command = function(dbot) {
    /**
     * Is user banned from using command?
     */
    var isBanned = function(user, command) {
        var banned = false;
        if(_.has(dbot.db.bans, command)) {
            if(_.include(dbot.db.bans[command], user) || _.include(dbot.db.bans['*'], user)) {
                banned = true;
            }
        }
        return banned;
    };

    /**
     * Does the user have the correct access level to use the command?
     */
    var hasAccess = function(user, command) {
        var access = true;
        var accessNeeded = dbot.commands[command].access;

        if(accessNeeded == 'admin') {
            if(!_.include(dbot.config.admins, user)) {
                access = false;
            }
        } else if(accessNeeded == 'moderator') {
            if(!_.include(dbot.config.moderators, user) && 
                    !_.include(dbot.config.admins, user)) {
                access = false;
            }
        }

        return access;
    };

    /**
     * Is user ignoring command?
     */
    var isIgnoring = function(user, command) {
        var module = dbot.commands[command].module;
        var ignoring = false;
        if(_.has(dbot.db.ignores, user) && _.include(dbot.db.ignores[user], module)) {
            ignoring = true;
        }
        return ignoring;
    };

    /**
     * Apply Regex to event message, store result. Return false if it doesn't
     * apply.
     */
    var applyRegex = function(commandName, event) {
        var applies = false;
        if(_.has(dbot.commands[commandName], 'regex')) {
            var cRegex = dbot.commands[commandName].regex;
            var q = event.message.valMatch(cRegex[0], cRegex[1]);
            if(q) {
                applies = true;
                event.input = q;
            }
        } else {
            applies = true;
        }
        return applies;
    };

    return {
        'name': 'command',
        'ignorable': false,

        'commands': {
            '~usage': function(event) {
                var commandName = event.params[1];
                if(_.has(dbot.usage, commandName)) {
                    event.reply(dbot.t('usage', {
                        'command': commandName,
                        'usage': dbot.usage[commandName]
                    }));
                } else {
                    event.reply(dbot.t('no_usage_info', { 
                        'command': commandName 
                    }));
                }
            },

            '~help': function(event) {
                var moduleName = event.params[1];
                if(!_.has(dbot.modules, moduleName)) {
                    var moduleName = dbot.commands[moduleName].module; 
                }

                if(moduleName && _.has(dbot.config[moduleName], 'help')) {
                    var help = dbot.config[moduleName].help;
                    event.reply(dbot.t('help_link', {
                        'module': moduleName,
                        'link': help
                    }));
                } else {
                    if(!moduleName) {
                        moduleName = event.params[1];
                    }
                    event.reply(dbot.t('no_help', { 'module': moduleName }))
                }
            }
        },

        /**
         * Run the appropriate command given the input.
         */
        'listener': function(event) {
            var commandName = event.params[0];
            if(!_.has(dbot.commands, commandName)) {
                commandName = '~';
            }

            if(isBanned(event.user, commandName)) {
                event.reply(dbot.t('command_ban', {'user': event.user})); 
            } else {
                if(!isIgnoring(event.user, commandName) && 
                        hasAccess(event.user, commandName) &&
                        dbot.commands[commandName].disabled !== true) {
                    if(applyRegex(commandName, event)) {
                        try {
                            dbot.commands[commandName](event);
                        } catch(err) {
                            if(dbot.config.debugMode == true) {
                                event.reply('- Error in ' + commandName + ':');
                                event.reply('- Message: ' + err);
                                event.reply('- Top of stack: ' + err.stack.split('\n')[1].trim());
                            }
                        }
                        dbot.save();
                    } else {
                        if(commandName !== '~') {
                            if(_.has(dbot.usage, commandName)) {
                                event.reply('Usage: ' + dbot.usage[commandName]);
                            } else {
                                event.reply(dbot.t('syntax_error'));
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

