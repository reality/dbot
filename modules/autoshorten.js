/**
 * Module Name: AutoShorten
 * Description: Automatically shorten link over a certain length and post the
 * short link to the channel.
 */
var http = require('http');

var autoshorten = function(dbot) {
    var name = 'autoshorten';
    var dbot = dbot;

    return {
        'listener': function(event) {
            var urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
            var urlMatches = event.message.match(urlRegex);

            if(urlMatches !== null && urlMatches[0].length > 80) {
                var url = urlMatches[0]; // Only doing one, screw you.
                
                // TODO: Make this use a decent URL shortener. Mine is shit.
                var options = {
                    'host': 'nc.no.de',
                    'port': 80,
                    'path': '/mkurl?url=' + escape(url)
                };

                http.get(options, function(res) {
                    res.setEncoding('utf8');
                    res.on('data', function (response) {
                        event.reply(dbot.t('shorten_link', {'user': event.user}) + JSON.parse(response).surl); 
                    });
                });
            }
        },

        'on': 'PRIVMSG',
        'name': name,
        'ignorable': true
    };
}

exports.fetch = function(dbot) {
    return autoshorten(dbot);
};
