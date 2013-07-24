var youAre = function(dbot) {
    this.listener = function(event) {
        var key = event.message.valMatch(/(\bis\b|\bare\b)\s+([\w\s\d]*?)(\s+)?(,|\.|\band\b|$)/, 5);

        if(key && key[2] != "" && (Math.floor(Math.random() * (101)) / 1) == 1) {
            event.reply(event.user + ': You\'re ' + key[2] + '.');
        }
    }.bind(this);
    this.on = 'PRIVMSG';
};

exports.fetch = function(dbot) {
    return new youAre(dbot);
};
