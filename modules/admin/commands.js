var fs = require('fs'),
    _ = require('underscore')._,
    sys = require('sys'),
    exec = require('child_process').exec;

var commands = function(dbot) {
    var getCurrentConfigPath = function(configKey) {
        var defaultConfigPath = dbot.config;
        var userConfigPath = dbot.db.config;

        if(configKey) {
            var configKey = configKey.split('.');
            for(var i=0;i<configKey.length-1;i++) {
                if(_.has(defaultConfigPath, configKey[i])) {
                    if(!_.has(userConfigPath, configKey[i])) {
                        userConfigPath[configKey[i]] = {};
                    }
                    userConfigPath = userConfigPath[configKey[i]];
                    defaultConfigPath = defaultConfigPath[configKey[i]];
                } else {
                    return false;
                }
            }
        } 

        return { 
            'user': userConfigPath,
            'default': defaultConfigPath
        };
   };

    var commands = {
        // Join a channel
        'join': function(event) {
            var channel = event.params[1];
            if(_.has(event.allChannels, channel)) {
                event.reply(dbot.t('already_in_channel', {'channel': channel}));
            } else {
                dbot.instance.join(event, channel); 
                event.reply(dbot.t('join', {'channel': channel}));
            }
        },

        // Leave a channel
        'part': function(event) {
            var channel = event.params[1];
            if(!_.has(event.allChannels, channel)) {
                event.reply(dbot.t('not_in_channel', {'channel': channel}));
            } else {
                event.instance.part(event, channel); 
                event.reply(dbot.t('part', {'channel': channel}));
            }
        },

        // Op admin caller in given channel
        'opme': function(event) {
            var channel = event.params[1];

            // If given channel isn't valid just op in current one.
            if(!_.has(event.allChannels, channel)) {
                channel = event.channel.name;
            }
            dbot.instance.mode(event, channel, ' +o ' + event.user);
        },

        // Do a git pull and reload
        'greload': function(event) {
            exec("git pull", function (error, stdout, stderr) {
                exec("git submodule update", function (error, stdout, stderr) {
                    event.reply(dbot.t('gpull'));
                    commands.reload(event);
                    event.message = 'version';
                    event.action = 'PRIVMSG';                                       
                    event.params = event.message.split(' ');                        
                    dbot.instance.emit(event);  
                }.bind(this));
            }.bind(this));
        },

        // Display commit information for part of dbot
        'version': function(event){
            var cmd = "git log --pretty=format:'%h (%s): %ar' -n 1 -- ";
            if(event.params[1]){
                var input = event.params[1].trim();
                if(_.has(dbot.modules, input.split("/")[0])){
                    cmd += "modules/"+input;
                }
                else{
                    cmd += input;
                }
            }

            exec(cmd, function(error, stdout, stderr){
                if(stdout.length > 0){
                    event.reply(stdout);
                }
                else{
                    event.reply("No version information or queried module not loaded");
                }
            }.bind(this));
        },

        // Reload DB, translations and modules.
        'reload': function(event) {
            dbot.db = JSON.parse(fs.readFileSync('db.json', 'utf-8'));
            dbot.reloadModules();
            event.reply(dbot.t('reload'));
        },

        // Say something in a channel
        'say': function(event) {
            var channel = event.params[1];
            if(event.params[1] === "@") {
                var channel = event.channel.name;
            }             
            var message = event.params.slice(2).join(' ');
            dbot.say(event.server, channel, message);
        },

        // Load new module 
        'load': function(event) {
            var moduleName = event.params[1];
            if(!_.include(dbot.config.moduleNames, moduleName)) {
                dbot.config.moduleNames.push(moduleName);
                dbot.reloadModules();
                event.reply(dbot.t('load_module', {'moduleName': moduleName}));
            } else {
                if(moduleName == 'web') {
                    event.reply(dbot.t('already_loaded_web'));
                } else {
                    event.reply(dbot.t('already_loaded', {'moduleName': moduleName}));
                }
            }
        },

        // Unload a loaded module
        'unload': function(event) {
            var moduleNames = dbot.config.moduleNames;
            var moduleName = event.params[1];
            if(_.include(moduleNames, moduleName)) {
                var moduleDir = '../' + moduleName + '/';
                var cacheKey = require.resolve(moduleDir + moduleName);
                delete require.cache[cacheKey];
                dbot.config.moduleNames = _.without(dbot.config.moduleNames, moduleName);
                dbot.reloadModules();

                event.reply(dbot.t('unload_module', {'moduleName': moduleName}));
            } else {
                event.reply(dbot.t('unload_error', {'moduleName': moduleName}));
            }
        },

        // Ban user from command or *
        'ban': function(event) {
            var username = event.params[1];
            var command = event.params[2];

            if(!_.has(dbot.db.bans, command)) {
                dbot.db.bans[command] = [ ];
            }
            dbot.db.bans[command].push(username);
            event.reply(dbot.t('banned', {'user': username, 'command': command}));
        },

        // Unban a user from command or *
        'unban': function(event) {
            var username = event.params[1];
            var command = event.params[2];
            if(_.has(dbot.db.bans, command) && _.include(dbot.db.bans[command], username)) {
                _.reject(dbot.db.bans[command], function(bans) {
                    return bans == username;
                }, this);
                event.reply(dbot.t('unbanned', {'user': username, 'command': command}));
            } else {
                event.reply(dbot.t('unban_error', {'user': username}));
            }
        },

        /*** Config options ***/

        'setconfig': function(event) {
            var configPathString = event.params[1];
            var configKey = _.last(configPathString.split('.'));
            var newOption = event.params[2];

            var configPath = getCurrentConfigPath(configPathString);
            var currentOption;
            if(_.has(configPath['user'], configKey)) {
                currentOption = configPath['user'][configKey];
            } else if(_.has(configPath['default'], configKey)) {
                currentOption = configPath['default'][configKey];
            } else {
                event.reply("Config key doesn't exist bro");
                return;
            }

            // Convert to boolean type if config item boolean
            if(_.isBoolean(currentOption)) {
                newOption = (newOption == "true");
            }

            if(_.isArray(currentOption)) {
                event.reply("Config option is an array. Try 'pushconfig'.");
            }

            // TODO: Same for numbers and that I assume
            
            event.reply(configPathString + ": " + currentOption + " -> " + newOption);
            configPath['user'][configKey] = newOption;
            dbot.reloadModules();
        },

        'showconfig': function(event) {
            var configPathString = event.params[1];
            var configPath = getCurrentConfigPath(configPathString);
            
            if(configPathString) {
                var configKey = _.last(configPathString.split('.'));

                if(!_.has(configPath['default'], configKey)) {
                    event.reply("Config path doesn't exist");
                    return;
                }

                if(_.isObject(configPath['default'][configKey])) {
                    event.reply('Config keys in ' + configPathString + ': ' + Object.keys(configPath['default'][configKey]));
                } else {
                    var currentOption = configPath['default'][configKey];
                    if(_.has(configPath['user'], configKey)) {
                        currentOption = configPath['user'][configKey];
                    }
                    event.reply(configKey + ': ' + currentOption);
                }
            } else {
                event.reply('Config keys in root: ' + Object.keys(configPath['default']));
            }
        }
    };

    commands['greload'].access = 'admin';
    commands['reload'].access = 'admin';
    commands['unload'].access = 'admin';
    commands['load'].access = 'admin';
    commands['setconfig'].access = 'admin';
    commands['showconfig'].access = 'moderator';
    commands['join'].access = 'moderator';
    commands['part'].access = 'moderator';
    commands['opme'].access = 'moderator';
    commands['say'].access = 'moderator';
    commands['ban'].access = 'moderator';
    commands['unban'].access = 'moderator';

    return commands;
};

exports.fetch = function(dbot) {
    return commands(dbot);
}
