var _ = require('underscore')._;

var commands = function(dbot) {
    return {
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
            if(!moduleName) {
                event.reply(dbot.t('usage', {
                    'command': '~help',
                    'usage': '~help [module]'
                }));
                return;
            }
            
            if(!_.has(dbot.modules, moduleName)) {
                if(_.has(dbot.commands, moduleName)) {
                    var moduleName = dbot.commands[moduleName].module; 
                } else {
                    var moduleName = undefined;
                }
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
    };
};

exports.fetch = function(dbot) {
    return commands(dbot);
};
