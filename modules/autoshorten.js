var http = require('http');

var autoshorten = function(dbot) {
    var dbot = dbot;

    return {
        'listener': function(data) {
            var urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
            var urlMatches = data.message.match(urlRegex);

            if(urlMatches !== null) {
                var url = urlMatches[0]; // Only doing one, screw you.
                
                var options = {
                    'host': 'nc.no.de',
                    'port': 80,
                    'path': '/mkurl?url=' + escape(url)
                };

                http.get(options, function(response) {
                    dbot.say(data.channel, 'Shortened link from ' + data.user + ': ' + response.surl); 
                });
            }
        },

        'on': 'PRIVMSG'
    };
}

exports.fetch = function(dbot) {
    return autoshorten(dbot);
};
