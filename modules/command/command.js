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
        console.log(Object.keys(this));
        var commandName = event.params[0];
        if(!_.has(this.dbot.commands, commandName)) {
            commandName = '~';
        }

        if(this.api.isBanned(event.user, commandName)) {
            event.reply(this.dbot.t('command_ban', {'user': event.user})); 
        } else {
            if(!this.api.isIgnoring(event.user, commandName) && 
                    this.api.hasAccess(event.user, commandName) &&
                    this.dbot.commands[commandName].disabled !== true) {
                if(this.api.applyRegex(commandName, event)) {
                    try {
                        this.dbot.commands[commandName](event);
                    } catch(err) {
                        if(this.dbot.config.debugMode == true) {
                            event.reply('- Error in ' + commandName + ':');
                            event.reply('- Message: ' + err);
                            event.reply('- Top of stack: ' + err.stack.split('\n')[1].trim());
                        }
                    }
                    this.dbot.save();
                } else {
                    if(commandName !== '~') {
                        if(_.has(this.dbot.usage, commandName)) {
                            event.reply('Usage: ' + this.dbot.usage[commandName]);
                        } else {
                            event.reply(this.dbot.t('syntax_error'));
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
