/**
 * Module Name: Command
 * Description: An essential module which maps PRIVMSG input to an appropriate
 * command and then runs that command, given the user isn't banned from or
 * ignoring that command.
 */
var _ = require('underscore')._;
var command = function(dbot) {
    this.dbot = dbot;
    
    /**
     * Run the appropriate command given the input.
     */
    this.listener = function(event) {
        var commandName = event.params[0];
        if(!_.has(dbot.commands, commandName)) {
            if(_.has(dbot.modules, 'quotes')) {
                commandName = '~';
            } else {
                return;
            }
        } 
       
        dbot.api.ignore.isUserIgnoring(event.server, event.user, commandName, function(isIgnoring) {
            dbot.api.ignore.isUserBanned(event.server, event.user, commandName, function(isBanned) {
                if(isBanned) {
                    event.reply(dbot.t('command_ban', {'user': event.user})); 
                } else if(!isIgnoring && 
                        this.api.hasAccess(event.user, commandName) && 
                        dbot.commands[commandName].disabled !== true) {
                    if(this.api.applyRegex(commandName, event)) {
                        try {
                            var command = dbot.commands[commandName];
                            var results = command.apply(dbot.modules[command.module], [event]);
                            if(_.has(command, 'hooks') && results !== false) {
                                _.each(command['hooks'], function(hook) {
                                    hook.apply(hook.module, _.values(results)); 
                                }, this);
                            }
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
            }.bind(this));
        }.bind(this));
    }.bind(this);
    this.on = 'PRIVMSG';
};

exports.fetch = function(dbot) {
    return new command(dbot);
};
