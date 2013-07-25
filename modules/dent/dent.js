var request = require('request');
    _ = require('underscore')._;

var dent = function(dbot) {
    this.StatusRegex = {
      identica: /\bhttps?:\/\/identi\.ca\/notice\/(\d+)\b/ig,
      twitter: /\bhttps?:\/\/twitter\.com\/\w+\/status\/(\d+)\b/ig
    };

    this.StatusAPI = {
      identica: "http://identi.ca/api/statuses/show.json",
      twitter: "https://api.twitter.com/1/statuses/show.json"
    };

    this.api = {
        'post': function(content) {
            var username = this.config.username,
                password = this.config.password,
                info,
                auth = "Basic " +
                new Buffer(username + ":" + password).toString("base64");

            request.post({
                'url': 'http://identi.ca/api/statuses/update.json?status=' +
                    escape(content),
                'headers': {
                    'Authorization': auth
                }
            },
            function(error, response, body) {
                console.log(body);
            }.bind(this));
        }
    };

    this.lookup = function(id, service, callback) {
      request({
        url: this.StatusAPI[service],
        qs: {"id": id},
        json: true
      }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
          if (_.has(body, 'text')) {
            callback(service + " [" + body.user.screen_name + '] ' + body.text);
          }
        }
      });
    };

    this.commands = {
        '~dent': function(event) {
            this.api.post(event.input[1]);
            event.reply('Dent posted (probably).');
        }
    };
    this.commands['~dent'].regex = [/^~dent (.+)$/, 2];

    this.onLoad = function() {
        if(this.config.dentQuotes === true && _.has(dbot.modules, 'quotes')) {
            dbot.api.event.addHook('~qadd', function(key, text) {
                if(text.indexOf('~~') == -1) {
                    this.api.post(key + ': ' + text);
                }
            }.bind(this));
        }

        for(s in this.StatusRegex) {
            dbot.api.link.addHandler(s, this.StatusRegex[s], function(matches, name, callback) {
                this.lookup(matches[1], name, callback);
            }.bind(this));
        }
    }.bind(this);
};

exports.fetch = function(dbot) {
    return new dent(dbot);
};
