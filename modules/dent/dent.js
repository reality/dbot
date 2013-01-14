var request = require('request');
    _ = require('underscore')._;

var dent = function(dbot) {
    var api = {
        'post': function(content) {
            var username = dbot.config.dent.username,
                password = dbot.config.dent.password,
                info,
                auth = "Basic " + 
                new Buffer(username + ":" + password).toString("base64");

            request.post({
                'url': 'http://identi.ca/api/statuses/update.json?status=' +
                    content, 
                'headers': {
                    'Authorization': auth
                }
            },
            function(error, response, body) {
                console.log(body);
            }.bind(this));
        }
    };

    var commands = {
        '~dent': function(event) {
            api.post(event.input[1]);
            event.reply('Dent posted (probably).');
        }
    };
    commands['~dent'].regex = [/^~dent (.+)$/, 2];

    return {
        'name': 'dent',
        'commands': commands,
        'api': api
    };
};

exports.fetch = function(dbot) {
    return dent(dbot);
};
