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
            dbot.instance.join(event, channel); 
            event.reply(dbot.t('join', {'channel': channel}));
        },

        // Leave a channel
        'part': function(event) {
            var channel = event.params[1];
            event.instance.part(event, channel); 
            event.reply(dbot.t('part', {'channel': channel}));
        },

        // Op admin caller in given channel
        'opme': function(event) {
            event.channel = event.params[1];
            dbot.instance.mode(event, '+o ' + event.user);
        },

        // Do a git pull and reload
        'greload': function(event) {
            var child = exec("git pull", function (error, stdout, stderr) {
                event.reply(dbot.t('gpull'));
                commands.reload(event);
            }.bind(this));
        },

        // Reload DB, translations and modules.
        'reload': function(event) {
            dbot.db = JSON.parse(fs.readFileSync('db.json', 'utf-8'));
            dbot.strings = JSON.parse(fs.readFileSync('strings.json', 'utf-8'));
            dbot.reloadModules();
            event.reply(dbot.t('reload'));
        },

        // Say something in a channel (TODO probably doesn't work.)
        'say': function(event) {
            var channel = event.params[1];
            if(event.params[1] === "@") {
                var channel = event.channel;
            }             
            var message = event.params.slice(2).join(' ');
            dbot.say(event.server, channel, message);
        },

        // Load new module 
        'load': function(event) {
            var moduleName = event.params[1];
            dbot.moduleNames.push(moduleName);
            dbot.reloadModules();
            event.reply(dbot.t('load_module', {'moduleName': moduleName}));
        },

        // Unload a loaded module
        'unload': function(event) {
            var moduleName = event.params[1];
            if(dbot.moduleNames.include(moduleName)) {
                var cacheKey = require.resolve('../modules/' + moduleName);
                delete require.cache[cacheKey];

                var moduleIndex = dbot.moduleNames.indexOf(moduleName);
                dbot.moduleNames.splice(moduleIndex, 1);
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
        },

        // Lock quote category so quotes can't be removed
        'lock': function(event) {
            var category = event.params[1];
            dbot.db.locks.push(category);
            event.reply(dbot.t('qlock', {'category': category}));
        }
    };

    return {
        'name': 'admin',
        'ignorable': false,

        /**
         * Run the appropriate admin command given the input (and user).
         */
        'listener': function(event) {
            var commandName = event.params[0];
            if(commands.hasOwnProperty(commandName) && dbot.admin.include(event.user)) {
                commands[commandName](event);
                dbot.save();
            }
        },
        'on': 'PRIVMSG'
    };
};

exports.fetch = function(dbot) {
    return admin(dbot);
};
