var fs = require('fs');

var adminCommands = function(dbot) {
    var dbot = dbot;

    var commands = {
        'join': function(data, params) {
            dbot.instance.join(params[1]); 
            dbot.say(dbot.admin, 'Joined ' + params[1]);
        },

        'part': function(data, params) {
            dbot.part(params[1]);
        },

        'reload': function(data, params) {
            dbot.db = JSON.parse(fs.readFileSync('db.json', 'utf-8'));
            dbot.reloadModules();
            dbot.say(dbot.admin, 'Reloaded.');
        },

        'say': function(data, params) {
            var c = params[1];
            var m = params.slice(2).join(' ');
            dbot.say(c, m);
        }
    };

    return {
        'listener': function(data) {
            params = data.message.split(' ');

            if(commands.hasOwnProperty(params[0])) 
                commands[params[0]](data, params);
        },

        'on': 'PRIVMSG'
    };
};

exports.fetch = function(dbot) {
    return adminCommands(dbot);
};
