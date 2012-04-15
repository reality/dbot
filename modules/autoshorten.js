var http = require('http');

var autoshorten = function(dbot) {
    var name = 'autoshorten';
    var dbot = dbot;

    return {
        'listener': function(data) {
            if((dbot.db.ignores.hasOwnProperty(data.user) && 
                        dbot.db.ignores[data.user].include(name)) == false) {
                var urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
                var urlMatches = data.message.match(urlRegex);

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
                            dbot.say(data.channel, 'Shortened link from ' + data.user + ': ' + JSON.parse(response).surl); 
                        });
                    });
                }
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
