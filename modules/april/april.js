var april = function(dbot) {
    this.listener = function(event) {
        var match = event.message.match(/^i'm ([^ ]+)$/i);
        if(match && event.channel == '#april') {
            dbot.say(event.server, 'operserv', 'svsnick ' + event.user + ' ' + match[1]);
            event.reply('Hi ' + match[1] + ', I\'m tripbot!');
        }
    }
    this.on = 'PRIVMSG';
};

exports.fetch = function(dbot) {
    return new april(dbot);
};
