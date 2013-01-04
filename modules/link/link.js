/**
 * Module Name: Link
 * Description: Stores recent channel links, with commands to retrieve
 * information about links.
 */
var request = require('request');
var link = function(dbot) {
    var urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    var links = {}; 
    var fetchTitle = function(event, link) {
        request(link, function (error, response, body) {
            if(!error && response.statusCode == 200) {
                body = body.replace(/(\r\n|\n\r|\n)/gm, " ");
                var title = body.valMatch(/<title>(.*)<\/title>/, 2);
                if(title) {
                    event.reply(title[1]);
                } else {
                    event.reply(dbot.t('title_not_found'));
                }
            }
        });
    };

    var commands = {
        '~title': function(event) {
            var link = links[event.channel.name];
            if(event.params[1] !== undefined) {
                var urlMatches = event.params[1].match(urlRegex);
                if(urlMatches !== null) {
                    link = urlMatches[0];
                }
            }
            fetchTitle(event, link);
        }
    };

    return {
        'name': 'link', 
        'ignorable': true,
        'commands': commands,

        'listener': function(event) {
            var urlMatches = event.message.match(urlRegex);
            if(urlMatches !== null) {
                links[event.channel.name] = urlMatches[0];

                if(dbot.config.link.autoTitle == true) {
                    fetchTitle(event, urlMatches[0]);
                }
            }
        },
        'on': 'PRIVMSG'
    };
};

exports.fetch = function(dbot) {
    return link(dbot);
};
