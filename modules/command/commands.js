var _ = require('underscore')._,
    request = require('request');

var commands = function(dbot) {
    var commands = {
        'usage': function(event) {
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

        '~commands': function(event) {
            var name = event.params[1];
            if(_.has(dbot.modules, name)) {
                var commands = _.keys(dbot.commands);
                commands = _.filter(commands, function(cName) {
                    return dbot.commands[cName].module == name; 
                });
                event.reply(dbot.t('module_commands', {
                    'module': name,
                    'commands': commands.join(', ')
                }));
            } else {
                event.reply(dbot.t('loaded_modules', {
                    'modules': _.keys(dbot.modules).join(', ')
                }));
            }
        },

        '~help': function(event) {
            var moduleName = event.params[1];
            if(!moduleName || !_.has(dbot.modules, moduleName)) {
                event.reply(dbot.t('usage', {
                    'command': this.config.commandPrefix + 'help',
                    'usage': this.config.commandPrefix + 'help [module]'
                }));
                event.reply(dbot.t('loaded_modules', {
                    'modules': _.keys(dbot.modules).join(', ')
                }));
            } else {
                var helpLink = dbot.config.repoRoot + 
                    'blob/master/modules/' + moduleName + '/README.md';
                if(dbot.config.modules[moduleName].help) {
                    helpLink = dbot.config.modules[moduleName].help;
                }

                // TODO: Check it exists
                event.reply(dbot.t('help_link', {
                    'module': moduleName,
                    'link': helpLink
                }));
           }
        }
    };
    commands['usage'].regex = [/usage ([^ ]+)/, 2];

    return commands;
};

exports.fetch = function(dbot) {
    return commands(dbot);
};
