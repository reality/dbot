/**
 * Module Name: Command
 * Description: An essential module which maps PRIVMSG input to an appropriate
 * command and then runs that command, given the user isn't banned from or
 * ignoring that command.
 */
var command = function(dbot) {
    var dbot = dbot;

    /**
     * Is user banned from using command?
     */
    var is_banned = function(user, command) {
        var banned = false;
        if(dbot.db.bans.hasOwnProperty(command)) {
            if(dbot.db.bans[command].include(user) || dbot.db.bans['*'].include(user)) {
                banned = true;
            }
        }
        return banned;
    }

    /**
     * Is user ignoring command?
     */
    var is_ignoring = function(user, command) {
        var module = dbot.commandMap[command];
        var ignoring = false;
        if(dbot.db.ignores.hasOwnProperty(user) && dbot.db.ignores[user].include(module)) {
            ignoring = true;
        }
        return ignoring;
    }

    return {
        'name': 'command',

        /**
         * Run the appropriate command given the input.
         */
        'listener': function(event) {
            var command_name = event.params[0];
            if(dbot.commands.hasOwnProperty(command_name)) {
                if(is_banned(event.user, command_name)) {
                    event.reply(dbot.t('command_ban', {'user': event.user})); 
                } else {
                    if(!is_ignoring(event.user, command_name)) {
                        dbot.commands[command_name](event);
                        dbot.save();
                    }
                }
            } 
        },

        'on': 'PRIVMSG',
        'ignorable': false
    };
};

exports.fetch = function(dbot) {
    return command(dbot);
};

