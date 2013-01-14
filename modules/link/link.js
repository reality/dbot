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
        request(link, function (error, response, body) {
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
        }
    };

    this.name = 'link';
    this.ignorable = true;
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
