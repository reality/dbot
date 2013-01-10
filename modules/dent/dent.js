var request = require('request');

var dent = function(dbot) {
    var username = dbot.config.dent.username;
    var password = dbot.config.dent.password;
    var commands = {
        '~dent': function(event) {
            var auth = "Basic " + 
                new Buffer(username + ":" + password).toString("base64");
            request.post({
                'url': 'http://identi.ca/api/statuses/update.json?status=' +
                    event.input[1], 
                'headers': {
                    'Authorization': auth
                }
            },
            function(error, response, body) {
                event.reply('Status posted (probably).');
            });
        }
    };
    commands['~dent'].regex = [/^~dent (.+)$/, 2];

    return {
        'commands': commands
    };
};

exports.fetch = function(dbot) {
    return dent(dbot);
};
