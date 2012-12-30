/**
 * Module Name: Ignore
 * Description: Handles commands in which users can choose to ignore listeners
 * and commands from certain modules. It also populates the JSBot instance with
 * this information, since that actually performs the ignorance.
 */
var ignore = function(dbot) {
    var commands = {
        '~ignore': function(event) {
            var ignorableModules = [];
            
            dbot.modules.each(function(module) {
                if(module.ignorable != null && module.ignorable == true) {
                    ignorableModules.push(module.name);
                }
            });
            var module = event.params[1];

            if(module === undefined) {
                event.reply(dbot.t('ignore_usage', {'user': event.user, 'modules': ignorableModules.join(', ')}));
            } else {
                if(ignorableModules.include(module)) {
                    if(dbot.db.ignores.hasOwnProperty(event.user) && dbot.db.ignores[event.user].include(module)) {
                        event.reply(dbot.t('already_ignoring', {'user': event.user}));
                    } else {
                        if(dbot.db.ignores.hasOwnProperty(module)) {
                            dbot.db.ignores[event.user].push(module);
                        } else {
                            dbot.db.ignores[event.user] = [module];
                        }

                        dbot.instance.ignoreTag(event.user, module);
                        event.reply(dbot.t('ignored', {'user': event.user, 'module': module}));
                    }
                } else {
                    event.reply(dbot.t('invalid_ignore', {'user': event.user}));
                }
            }
        }, 

        '~unignore': function(event) {
            var ignoredModules = [];
            if(dbot.db.ignores.hasOwnProperty(event.user)) {
                ignoredModules = dbot.db.ignores[event.user];
            }
            var module = event.params[1];

            if(module === undefined) {
                event.reply(dbot.t('unignore_usage', {'user': event.user, 'modules': ignoredModules.join(', ')}));
            } else {
                if(ignoredModules.include(module) == false) {
                    event.reply(dbot.t('invalid_unignore', {'user': event.user}));
                } else {
                    dbot.db.ignores[event.user].splice(dbot.db.ignores[event.user].indexOf(module), 1);
                    dbot.instance.removeIgnore(event.user, module)
                    event.reply(dbot.t('unignored', {'user': event.user, 'module': module}));
                }
            }
        }
    };

    return {
        'name': 'ignore',
        'ignorable': false, 
        'commands': commands,

        'onLoad': function() {
            dbot.instance.clearIgnores();
            for(var user in dbot.db.ignores) {
                if(dbot.db.ignores.hasOwnProperty(user)) {
                    for(var i=0;i<dbot.db.ignores[user].length;i++) {
                        dbot.instance.ignoreTag(user, dbot.db.ignores[user][i]);
                    }
                }
            }
        }
    };
};

exports.fetch = function(dbot) {
    return ignore(dbot);
};
