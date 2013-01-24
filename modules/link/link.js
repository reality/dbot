/**
 * Module Name: Link
 * Description: Stores recent channel links, with commands to retrieve
 * information about links.
 */
var request = require('request'),
    _ = require('underscore')._;

var link = function(dbot) {
    this.urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    this.links = {}; 
    this.fetchTitle = function(event, link) {
        request(link, function(error, response, body) {
            if(!error && response.statusCode == 200) {
                body = body.replace(/(\r\n|\n\r|\n)/gm, " ");
                var title = body.valMatch(/<title>(.*)<\/title>/, 2);
                if(title) {
                    event.reply(title[1]);
                }
            }
        });
    };

    var commands = {
        '~title': function(event) {
            var link = this.links[event.channel.name];
            if(!_.isUndefined(event.params[1])) {
                var urlMatches = event.params[1].match(this.urlRegex);
                if(urlMatches !== null) {
                    link = urlMatches[0];
                }
            }
            this.fetchTitle(event, link);
        },

        '~ud': function(event) {
	    var query = event.input[1];
            var reqUrl = 'http://api.urbandictionary.com/v0/define?term=' + encodeURI(query); 
            request(reqUrl, function(error, response, body) {
                var result = JSON.parse(body);
                if(_.has(result, 'result_type') && result.result_type != 'no_results') {
                    event.reply(query + ': ' + result.list[0].definition.split('\n')[0];
                } else {
                    event.reply(event.user + ': No definition found.');
                }
            });
        }
    };
    commands['~ud'].regex = [/~ud (.+)/, 2];
    this.commands = commands;

    this.listener = function(event) {
        var urlMatches = event.message.match(this.urlRegex);
        if(urlMatches !== null) {
            this.links[event.channel.name] = urlMatches[0];

            if(dbot.config.link.autoTitle == true) {
                this.fetchTitle(event, urlMatches[0]);
            }
        }
    }.bind(this);
    this.on = 'PRIVMSG';
};

exports.fetch = function(dbot) {
    return new link(dbot);
};
