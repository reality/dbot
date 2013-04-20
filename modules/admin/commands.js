var fs = require('fs'),
    _ = require('underscore')._,
    sys = require('sys'),
    exec = require('child_process').exec;

var commands = function(dbot) {
    var noChangeConfig = [ 'servers', 'name', 'moduleNames' ];
    
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


        'status': function(event) {
            var moduleName = event.params[1];
            if(_.has(dbot.status, moduleName)) {
                var status = dbot.status[moduleName];
                if(status === true) {
                    event.reply(moduleName + ' status: Shit looks good.');
                } else {
                    event.reply(moduleName + ' status: Failed to load: ' + status); 
                }
            } else {
                event.reply('Either that module wasn\'t on the roster or shit is totally fucked.');
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
                if(dbot.status[moduleName] === true) {
                    event.reply(dbot.t('load_module', {'moduleName': moduleName}));
                } else {
                    event.reply('Failed to load ' + moduleName + '. See \'status ' + moduleName + '\'.');
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
            var configPath = event.input[1],
                newOption = event.input[2];

            if(!_.include(noChangeConfig, configPath)) {
                this.internalAPI.getCurrentConfig(configPath, function(config) {
                    if(config) {
                        // Convert to boolean type if config item boolean
                        if(_.isBoolean(config)) {
                            newOption = (newOption == "true");
                        }

                        event.reply(configPath + ": " + config + " -> " + newOption);
                        config = newOption;
                        this.db.save('config', configPath, { 'value': config }, function(err) {
                            dbot.reloadModules();
                        });
                    } else {
                        event.reply('Config path doesn\'t exist, bro.');
                    }
                }.bind(this));
            } else {
                event.reply("This config option cannot be altered while the bot is running.");
            }
        },

        'pushconfig': function(event) {
            var configPath = event.input[1],
                newOption = event.input[2];

            if(!_.include(noChangeConfig, configPath)) {
                this.internalAPI.getCurrentConfig(configPath, function(config) {
                    if(config) {
                        if(_.isArray(config)) {
                            event.reply(configPath + ": " + config + " << " + newOption);
                            config.push(newOption);
                            this.db.save('config', configPath, { 'value': config }, function(err) {
                                dbot.reloadModules();
                            });
                        } else {
                            event.reply("Config option is not an array. Try 'setconfig'.");
                        }
                    } else {
                        event.reply('Config path doesn\'t exist, bro.');
                    }
                }.bind(this));
            } else {
                event.reply("This config option cannot be altered while the bot is running.");
            }
        },

        'showconfig': function(event) {
            var configPath = event.params[1];
            if(configPath) {
                this.internalAPI.getCurrentConfig(configPath, function(config) {
                    if(config) {
                        if(_.isArray(config)) {
                            event.reply('Config keys in ' + configPath + ': ' + config);
                        } else if(_.isObject(config)) {
                            event.reply('Config keys in ' + configPath + ': ' + _.keys(config));
                        } else {
                            event.reply(configPath + ': ' + config);
                        }
                    } else {
                        event.reply('Config path doesn\'t exist, bro.');
                    }
                });
            } else {
                event.reply('Config keys in root: ' + _.keys(dbot.config));
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

    commands['pushconfig'].regex = [/pushconfig ([^ ]+) ([^ ]+)/, 3];
    commands['setconfig'].regex = [/setconfig ([^ ]+) ([^ ]+)/, 3];

    return commands;
};

exports.fetch = function(dbot) {
    return commands(dbot);
}
