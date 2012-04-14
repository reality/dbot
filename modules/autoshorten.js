var autoshorten = function(dbot) {
    var dbot = dbot;

    return {
        'listener': function(data) {
            var urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
            var urlMatches = data.message.match(urlRegex);

            if(urlMatches !== null) {
                var url = urlMatches[0]; // Only doing one, screw you.

                var site = http.createClient(80, 'http://nc.no.de');
                var request = site.request("GET", 'mkurl', { 'host' : 'http://nc.no.de/',
                    'url': url});
                request.end();

                request.on('response', function(response) {
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
