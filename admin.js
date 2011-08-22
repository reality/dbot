var adminCommands = function(dbot) {
    var dbot = dbot;

    var commands = {
        'join': function(data, params) {
            dbot.join(params[1]); 
            dbot.say(admin, 'Joined ' + params[1]);
        },

        'part': function(data, params) {
            dbot.part(params[1]);
            dbot.say(admin);
        },

        'reload': function(data, params) {
            dbot.say(admin, 'Reloading DB.');
            try {
                dbot.db = JSON.parse(fs.readFileSync('db.json', 'utf-8'));
            } catch(err) {
                dbot.say(admin, 'DB reload failed.');
            } finally {
                dbot.say(admin, 'DB Reload successful.');
            }
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
