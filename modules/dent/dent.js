var request = require('request');
    _ = require('underscore')._;

var dent = function(dbot) {
    this.name = 'dent';
    this.dbot = dbot;

    this.api = {
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

    this.commands = {
        '~dent': function(event) {
            this.api.post(event.input[1]);
            event.reply('Dent posted (probably).');
        }
    };
    this.commands['~dent'].regex = [/^~dent (.+)$/, 2];
};

exports.fetch = function(dbot) {
    return new dent(dbot);
};
