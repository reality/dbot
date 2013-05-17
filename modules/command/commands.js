var _ = require('underscore')._,
    request = require('request');

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
            if(!moduleName || !_.has(dbot.modules, moduleName)) {
                event.reply(dbot.t('usage', {
                    'command': '~help',
                    'usage': '~help [module]'
                }));
                event.reply(dbot.t('loaded_modules', {
                    'modules': _.keys(dbot.modules).join(', ')
                }));
            } else {
                var helpLink = dbot.config.repoRoot + 
                    'blob/master/modules/' + moduleName + '/README.md';
                if(dbot.config[moduleName].help) {
                    helpLink = dbot.config[moduleName].help;
                }

                // TODO: Check it exists
                event.reply(dbot.t('help_link', {
                    'module': moduleName,
                    'link': helpLink
                }));
           }
        }
    };
};

exports.fetch = function(dbot) {
    return commands(dbot);
};
