var fs = require('fs');

var adminCommands = function(dbot) {
    var dbot = dbot;

    var commands = {
        'join': function(data, params) {
            dbot.instance.join(params[1]); 
            dbot.say(dbot.admin, 'Joined ' + params[1]);
        },

        'opme': function(data, params) {
           dbot.instance.send('MODE ' + params[1] + ' +o ', dbot.admin);
        },

        'part': function(data, params) {
            dbot.instance.part(params[1]);
        },

        'reload': function(data, params) {
            dbot.db = JSON.parse(fs.readFileSync('db.json', 'utf-8'));
            dbot.reloadModules();
            dbot.say(data.channel, 'Reloaded that shit.');
        },

        'say': function(data, params) {
            var c = params[1];
            var m = params.slice(2).join(' ');
            dbot.say(c, m);
        },

        'load': function(data, params) {
            dbot.moduleNames.push(params[1]);
            dbot.reloadModules();
            dbot.say(data.channel, 'Loaded new module: ' + params[1]);
        },

        'unload': function(data, params) {
            if(dbot.moduleNames.include(params[1])) {
                var cacheKey = require.resolve('../modules/' + params[1]);
                delete require.cache[cacheKey];
                delete dbot.moduleNames[params[1]];
                dbot.reloadModules();
                dbot.say(data.channel, 'Turned off module: ' + params[1]);
            } else {
                dbot.say(data.channel, 'Module ' + params[1] + ' isn\'t loaded... Idiot...');
            }
        },

        'ban': function(data, params) {
            if(dbot.db.bans.hasOwnProperty(params[2])) {
                dbot.db.bans[params[2]].push(params[1]);
            } else {
                dbot.db.bans[params[2]] = [ params[1] ];
            }
            dbot.say(data.channel, params[1] + ' banned from ' + params[2]);
        },

        'unban': function(data, params) {
            if(dbot.db.bans.hasOwnProperty(params[2]) && dbot.db.bans[params[2]].include(params[1])) {
                dbot.db.bans[params[2]].splice(dbot.db.bans[params[2]].indexOf(params[1]), 1);
                dbot.say(data.channel, params[1] + ' unbanned from ' + params[2]);
            } else {
                dbot.say(data.channel, 'It appears ' + params[1] + 'wasn\'t banned from that command, you fool.');
            }
        },

        'modehate': function(data, params) {
            dbot.db.modehate.push(params[1]);
            dbot.say(data.channel, 'Now modehating on ' + params[1]);
        },

        'unmodehate': function(data, params) {
            dbot.db.modehate.splice(dbot.db.modehate.indexOf(params[1]), 1);
            dbot.say(data.channel, 'No longer modehating on ' + params[1]);
        },

        'lock': function(data, params) {
            dbot.db.locks.push(params[1]);
            dbot.say(data.channel, 'Locked ' + params[1] + ' quotes.');
        }
    };

    return {
        // These commands are implemented as their own listener so it can easily
        // check whether the user is the admin, and so that the admin can't ban
        // themselves and then not be able to rectify it...
        'listener': function(data) {
            if(data.channel == dbot.name) data.channel = data.user;

            params = data.message.split(' ');
            if(commands.hasOwnProperty(params[0]) && data.user == dbot.admin) {
                commands[params[0]](data, params);
                dbot.save();
            }
        },

        'on': 'PRIVMSG'
    };
};

exports.fetch = function(dbot) {
    return adminCommands(dbot);
};
