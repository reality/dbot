var fs = require('fs'),
    _ = require('underscore')._,
    sys = require('sys'),
    exec = require('child_process').exec;

var commands = function(dbot) {
    var noChangeConfig = [ 'servers', 'name', 'moduleNames' ];

    var getCurrentConfig = function(configKey) {
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

        var currentOption;
        if(configKey && configKey.length != 1) {
            configKey = _.last(configKey);
            if(_.has(userConfigPath, configKey) && !_.isUndefined(userConfigPath[configKey])) {
                currentOption = userConfigPath[configKey];
            } else if(_.has(defaultConfigPath, configKey)) {
                currentOption = defaultConfigPath[configKey];
            }
        } else {
            currentOption = defaultConfigPath[configKey];
        }

        return { 
            'user': userConfigPath,
            'default': defaultConfigPath,
            'value': currentOption
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
                    event.reply(dbot.t("no_version"));
                }
            }.bind(this));
        },

        'status': function(event) {
            var moduleName = event.params[1];
            if(_.has(dbot.status, moduleName)) {
                var status = dbot.status[moduleName];
                if(status === true) {
                    event.reply(dbot.t("status_good",{"module":moduleName, "reason": status}));
                } else {
                    event.reply(dbot.t("status_bad",{"module":moduleName, "reason": status}));
                }
            } else {
                event.reply(dbot.t("status_unloaded"));
            }
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
                channel = event.channel.name;
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
                if(dbot.status[moduleName] === true) {
                    event.reply(dbot.t('load_module', {'moduleName': moduleName}));
                } else {
                    event.reply(dbot.t("load_failed",{"module": moduleName}));
                }
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
                try {
                    var cacheKey = require.resolve(moduleDir + moduleName);
                    delete require.cache[cacheKey];
                } catch(err) { }
                dbot.config.moduleNames = _.without(dbot.config.moduleNames, moduleName);
                dbot.reloadModules();

                event.reply(dbot.t('unload_module', {'moduleName': moduleName}));
            } else {
                event.reply(dbot.t('unload_error', {'moduleName': moduleName}));
            }
        },

        /*** Config options ***/

        'setconfig': function(event) {
            var configPathString = event.params[1],
                configKey = _.last(configPathString.split('.')),
                newOption = event.params[2];

            if(!_.include(noChangeConfig, configKey)) {
                var configPath = getCurrentConfig(configPathString);

                if(configPath == false || _.isUndefined(configPath.value)) {
                    event.reply(dbot.t("no_config_key"));
                    return;
                }
                var currentOption = configPath.value;

                // Convert to boolean type if config item boolean
                if(_.isBoolean(currentOption)) {
                    newOption = (newOption == "true");
                }

                // Convert to integer type is config item integer
                if(_.isNumber(currentOption)) {
                    newOption = parseInt(newOption);
                }

                if(_.isArray(currentOption)) {
                    event.reply(dbot.t("config_array",{"alternate": "pushconfig"}));
                }
                
                event.reply(configPathString + ": " + currentOption + " -> " + newOption);
                configPath['user'][configKey] = newOption;
                dbot.reloadModules();
            } else {
                event.reply(dbot.t("config_lock"));
            }
        },

        'pushconfig': function(event) {
            var configPathString = event.params[1],
                configKey = _.last(configPathString.split('.')),
                newOption = event.params[2];

            if(!_.include(noChangeConfig, configKey)) {
                var configPath = getCurrentConfig(configPathString);
                if(configPath == false || _.isUndefined(configPath.value)) {
                    event.reply(dbot.t("no_config_key"));
                    return;
                }
                var currentArray = configPath.value;

                if(!_.isArray(currentArray)) {
                    event.reply(dbot.t("config_array",{"alternate": "setconfig"}));
                    return;
                }

                event.reply(configPathString + ": " + currentArray + " << " + newOption);
                currentArray.push(newOption);
                dbot.reloadModules(); 
            }
        },

        'showconfig': function(event) {
            var configPathString = event.params[1];
            var configPath = getCurrentConfig(configPathString);
            
            if(configPathString) {
                var configKey = _.last(configPathString.split('.'));
                if(configKey) {
                    event.reply(dbot.t("no_config_path"));
                    return;
                }

                if(_.isArray(configPath.value)) {
                    event.reply(configKey + ': ' + configPath.value);
                } else if(_.isObject(configPath.value)) {
                    event.reply(dbot.t("config_keys_location",{"path":configPathString,"value":Object.keys(configPath.value)}));
                } else {
                    event.reply(configKey + ': ' + configPath.value);
                }
            } else {
                event.reply(dbot.t("config_keys_location",{"path":"root","value":Object.keys(configPath['default'])}));
            }
        }
    };

    _.each(commands, function(command) {
        command.access = 'admin'; 
    });

    commands['showconfig'].access = 'moderator';
    commands['join'].access = 'moderator';
    commands['part'].access = 'moderator';
    commands['opme'].access = 'moderator';
    commands['say'].access = 'moderator';

    return commands;
};

exports.fetch = function(dbot) {
    return commands(dbot);
}
