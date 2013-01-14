/**
 * Module Name: Command
 * Description: An essential module which maps PRIVMSG input to an appropriate
 * command and then runs that command, given the user isn't banned from or
 * ignoring that command.
 */
var _ = require('underscore')._;
var command = function(dbot) {
    this.name = 'command';
    this.ignorable = false;
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
        
        if(this.api.isBanned(event.user, commandName)) {
            event.reply(dbot.t('command_ban', {'user': event.user})); 
        } else {
            if(!this.api.isIgnoring(event.user, commandName) && 
                    this.api.hasAccess(event.user, commandName) &&
                    dbot.commands[commandName].disabled !== true) {
                if(this.api.applyRegex(commandName, event)) {
                    try {
                        var command = dbot.commands[commandName];
                        command.apply(dbot.modules[command.module], [event]);
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
    }.bind(this);
    this.on = 'PRIVMSG';
};

exports.fetch = function(dbot) {
    return new command(dbot);
};
