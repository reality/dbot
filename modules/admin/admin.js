/**
 * Module Name: Admin
 * Description: Set of commands which only one who is a DepressionBot
 * administrator can run - as such, it has its own command execution listener.
 */
var fs = require('fs');
var sys = require('sys')
var exec = require('child_process').exec;

var admin = function(dbot) {
    var commands = {
        // Join a channel
        'join': function(event) {
            var channel = event.params[1];
            if(event.allChannels.hasOwnProperty(channel)) {
                event.reply(dbot.t('already_in_channel', {'channel': channel}));
            } else {
                dbot.instance.join(event, channel); 
                event.reply(dbot.t('join', {'channel': channel}));
            }
        },

        // Leave a channel
        'part': function(event) {
            var channel = event.params[1];
            if(!event.allChannels.hasOwnProperty(channel)) {
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
            if(!event.allChannels.hasOwnProperty(channel)) {
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
                if(dbot.modules.hasOwnProperty(input.split("/")[0])){
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
            if(!dbot.config.moduleNames.include(moduleName)) {
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
            if(moduleNames.include(moduleName)) {
                var moduleDir = '../' + moduleName + '/';
                var cacheKey = require.resolve(moduleDir + moduleName);
                delete require.cache[cacheKey];

                var moduleIndex = moduleNames.indexOf(moduleName);
                moduleNames.splice(moduleIndex, 1);
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

            if(!dbot.db.bans.hasOwnProperty(command)) {
                dbot.db.bans[command] = [ ];
            }
            dbot.db.bans[command].push(username);
            event.reply(dbot.t('banned', {'user': username, 'command': command}));
        },

        // Unban a user from command or *
        'unban': function(event) {
            var username = event.params[1];
            var command = event.params[2];
            if(dbot.db.bans.hasOwnProperty(command) && dbot.db.bans[command].include(username)) {
                dbot.db.bans[command].splice(dbot.db.bans[command].indexOf(username), 1);
                event.reply(dbot.t('unbanned', {'user': username, 'command': command}));
            } else {
                event.reply(dbot.t('unban_error', {'user': username}));
            }
        }
    };

    commands['greload'].access = 'admin';
    commands['reload'].access = 'admin';
    commands['unload'].access = 'admin';
    commands['load'].access = 'admin';
    commands['join'].access = 'moderator';
    commands['part'].access = 'moderator';
    commands['opme'].access = 'moderator';
    commands['say'].access = 'moderator';
    commands['ban'].access = 'moderator';
    commands['unban'].access = 'moderator';

    return {
        'name': 'admin',
        'ignorable': false,
        'commands': commands
    };
};

exports.fetch = function(dbot) {
    return admin(dbot);
};
