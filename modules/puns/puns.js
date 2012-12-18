var puns = function(dbot) {
    var name = 'puns';
    var dbot = dbot;

    return {
        'name': name,
        'ignorable': true,

        'listener': function(event) {
            event.user = dbot.cleanNick(event.user);
            if(dbot.config.moduleNames.include('quotes') &&
                    dbot.db.quoteArrs.hasOwnProperty(event.user)) {
                event.message = '~q ' + event.user;
                event.action = 'PRIVMSG';
                event.params = event.message.split(' ');
                dbot.instance.emit(event);
            }
        },
        'on': 'JOIN'
    };
}

exports.fetch = function(dbot) {
    return puns(dbot);
};
