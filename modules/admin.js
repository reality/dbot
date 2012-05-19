var fs = require('fs');
var sys = require('sys')
var exec = require('child_process').exec;

var adminCommands = function(dbot) {
    var dbot = dbot;

    var commands = {
        'join': function(data, params) {
            dbot.instance.join(params[1]); 
            dbot.say(data.channel, 'Joined ' + params[1]);
        },

        'opme': function(data, params) {
           dbot.instance.send('MODE ' + params[1] + ' +o ', data.user);
        },

        'part': function(data, params) {
            dbot.instance.part(params[1]);
        },

        // Do a git pull and reload
        'greload': function(data, params) {
            var child;

            child = exec("git pull", function (error, stdout, stderr) {
                console.log(stderr);
                dbot.say(data.channel, dbot.t('gpull'));
                commands.reload(data, params);
            }.bind(this));
        },

        'reload': function(data, params) {
            dbot.db = JSON.parse(fs.readFileSync('db.json', 'utf-8'));
            dbot.strings = JSON.parse(fs.readFileSync('strings.json', 'utf-8'));
            dbot.reloadModules();
            dbot.say(data.channel, dbot.t('reload'));
        },

        'say': function(data, params) {
            if (params[1] === "@") {
                var c = data.channel;
            } else {
                var c = params[1];
            }
            var m = params.slice(2).join(' ');
            dbot.say(c, m);
        },

        'act': function(data, params) {
            if (params[1] === "@") {
                var c = data.channel;
            } else {
                var c = params[1];
            }
            var m = params.slice(2).join(' ');
            dbot.act(c, m);
        },

        'load': function(data, params) {
            dbot.moduleNames.push(params[1]);
            dbot.reloadModules();
            dbot.say(data.channel, dbot.t('load_module', {'moduleName': params[1]}));
        },

        'unload': function(data, params) {
            if(dbot.moduleNames.include(params[1])) {
                var cacheKey = require.resolve('../modules/' + params[1]);
                delete require.cache[cacheKey];

                var moduleIndex = dbot.moduleNames.indexOf(params[1]);
                dbot.moduleNames.splice(moduleIndex, 1);

                dbot.reloadModules();
                dbot.say(data.channel, dbot.t('unload_module', {'moduleName': params[1]}));
            } else {
                dbot.say(data.channel, dbot.t('unload_error', {'moduleName': params[1]}));
            }
        },

        'ban': function(data, params) {
            if(dbot.db.bans.hasOwnProperty(params[2])) {
                dbot.db.bans[params[2]].push(params[1]);
            } else {
                dbot.db.bans[params[2]] = [ params[1] ];
            }
            dbot.say(data.channel, dbot.t('banned', {'user': params[1], 'command': params[2]}));
        },

        'unban': function(data, params) {
            if(dbot.db.bans.hasOwnProperty(params[2]) && dbot.db.bans[params[2]].include(params[1])) {
                dbot.db.bans[params[2]].splice(dbot.db.bans[params[2]].indexOf(params[1]), 1);
                dbot.say(data.channel, dbot.t('unbanned', {'user': params[1], 'command': params[2]}));
            } else {
                dbot.say(data.channel, dbot.t('unban_error', {'user': params[1]}));
            }
        },

        'modehate': function(data, params) {
            dbot.db.modehate.push(params[1]);
            dbot.say(data.channel, dbot.t('modehate', {'user': params[1]}));
        },

        'unmodehate': function(data, params) {
            dbot.db.modehate.splice(dbot.db.modehate.indexOf(params[1]), 1);
            dbot.say(data.channel, dbot.t('unmodehate', {'user': params[1]}));
        },

        'lock': function(data, params) {
            dbot.db.locks.push(params[1]);
            dbot.say(data.channel, dbot.t('qlock', {'category': params[1]}));
        }
    };

    return {
        // These commands are implemented as their own listener so it can easily
        // check whether the user is the admin, and so that the admin can't ban
        // themselves and then not be able to rectify it...
        'listener': function(data) {
            if(data.channel == dbot.name) data.channel = data.user;

            params = data.message.split(' ');
            if(commands.hasOwnProperty(params[0]) && dbot.admin.include(data.user)) {
                commands[params[0]](data, params);
                dbot.save();
            }
        },

        'onLoad': function() {
            return {
                '~resetadmin': function(data, params) {
                    dbot.admin = dbot.config.admin;
                }
            }
        },

        'on': 'PRIVMSG',

        'name': 'admin',

        'ignorable': false
    };
};

exports.fetch = function(dbot) {
    return adminCommands(dbot);
};
