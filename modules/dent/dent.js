var request = require('request');
    _ = require('underscore')._;

var dent = function(dbot) {
    this.dbot = dbot;
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
            var username = dbot.config.dent.username,
                password = dbot.config.dent.password,
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

    this.lookup = function(event, id, service) {
      request({
        url: this.StatusAPI[service],
        qs: {"id": id},
        json: true
      }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
          if (_.has(body, 'text')) {
            event.reply(service + " [" + body.user.screen_name + '] ' + body.text);
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
        if(dbot.config.dent.dentQuotes === true && _.has(dbot.modules, 'quotes')) {
            dbot.api.command.addHook('~qadd', function(key, text) {
                if(text.indexOf('~~') == -1) {
                    this.api.post(key + ': ' + text);
                }
            }.bind(this));
        }
    }.bind(this);
    
    this.listener = function(event) {
      for (s in this.StatusRegex) {
        if (this.StatusRegex.hasOwnProperty(s)) {
          var matches = this.StatusRegex[s].exec(event.message);
          if (matches != null) {
            this.lookup(event, matches[1], s);
          }
        }
      }
    }.bind(this);

    this.on = 'PRIVMSG';
};

exports.fetch = function(dbot) {
    return new dent(dbot);
};
