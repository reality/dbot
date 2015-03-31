var april = function(dbot) {
    this.listener = function(event) {
        var match = event.message.match(/^i'?( a)?m (an? )?([^ ]+)/i);
        if(match && event.channel == '#april') {
            dbot.say(event.server, 'operserv', 'svsnick ' + event.user + ' ' + match[3]);
            setTimeout(function() {
                event.reply('Hi ' + match[3] + ', I\'m tripbot!');
            }, 1000);
        }
    }
    this.on = 'PRIVMSG';
};

exports.fetch = function(dbot) {
    return new april(dbot);
};
