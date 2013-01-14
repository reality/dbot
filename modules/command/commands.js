var _ = require('underscore')._;

var commands = {
        '~usage': function(event) {
            var commandName = event.params[1];
            if(_.has(this.dbot.usage, commandName)) {
                event.reply(this.dbot.t('usage', {
                    'command': commandName,
                    'usage': this.dbot.usage[commandName]
                }));
            } else {
                event.reply(this.dbot.t('no_usage_info', { 
                    'command': commandName 
                }));
            }
        },

        '~help': function(event) {
            var moduleName = event.params[1];
            if(!_.has(this.dbot.modules, moduleName)) {
                var moduleName = this.dbot.commands[moduleName].module; 
            }

            if(moduleName && _.has(this.dbot.config[moduleName], 'help')) {
                var help = this.dbot.config[moduleName].help;
                event.reply(this.dbot.t('help_link', {
                    'module': moduleName,
                    'link': help
                }));
            } else {
                if(!moduleName) {
                    moduleName = event.params[1];
                }
                event.reply(this.dbot.t('no_help', { 'module': moduleName }))
            }
        }
};

exports.fetch = commands;
