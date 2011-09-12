var fs = require('fs');

var adminCommands = function(dbot) {
    var dbot = dbot;

    var commands = {
        'join': function(data, params) {
            dbot.instance.join(params[1]); 
            dbot.say(dbot.admin, 'Joined ' + params[1]);
        },

        'opme': function(data, params) {
           dbot.instance.send('MODE #42 +v ', dbot.admin);
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
            console.log(dbot.moduleNames);
            if(dbot.moduleNames.include(params[1])) {
                dbot.moduleNames[params[1]] = undefined;
                dbot.reloadModules();
                dbot.say(data.channel, 'Turned off module: ' + params[1]);
            } else {
                dbot.say(data.channel, 'Module ' + params[1] + ' isn\'t loaded... Idiot...');
            }
        }
    };

    return {
        'listener': function(data) {
            params = data.message.split(' ');

            if(commands.hasOwnProperty(params[0]) && data.user == dbot.admin) 
                commands[params[0]](data, params);
        },

        'on': 'PRIVMSG'
    };
};

exports.fetch = function(dbot) {
    return adminCommands(dbot);
};
