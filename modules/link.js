/**
 * Module Name: Link
 * Description: Stores recent channel links, with commands to retrieve
 * information about links.
 */
var request = require('request');
var link = function(dbot) {
    var urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    var links = {}; 

    var commands = {
        '~title': function(event) {
            var link = links[event.channel];
            if(event.params[1] !== undefined) {
                var urlMatches = event.params[1].match(urlRegex);
                if(urlMatches !== null) {
                    link = urlMatches[0];
                }
            }

            request(link, function (error, response, body) {
                if(!error && response.statusCode == 200) {
                    var title = body.valMatch(/<title>(.*)<\/title>/, 2);
                    if(title) {
                        event.reply(title[1]);
                    } else {
                        event.reply('no title found');
                    }
                }
            });
        }
    };

    return {
        'name': 'link', 
        'ignorable': true,

        'onLoad': function() {
            return commands;
        },

        'listener': function(event) {
            var urlMatches = event.message.match(urlRegex);
            if(urlMatches !== null) {
                links[event.channel] = urlMatches[0];
            }
        },

        'on': 'PRIVMSG'
    };
};

exports.fetch = function(dbot) {
    return link(dbot);
};
