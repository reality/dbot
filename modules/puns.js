var puns = function(dbot) {
    var name = 'puns';
    var dbot = dbot;

    return {
        'listener': function(event) {
            event.user = dbot.cleanNick(data.user);

            if((dbot.db.ignores.hasOwnProperty(event.user) && 
                        dbot.db.ignores[event.user].include(name)) == false) {
                if(dbot.moduleNames.include('quotes') &&
                        dbot.db.quoteArrs.hasOwnProperty(data.user)) {
                    data.message = '~q ' + data.user.toLowerCase();
                    var params = data.message.split(' ');
                    dbot.commands[params[0]](data, params);
                }
            }
        },

        'on': 'JOIN',

        'name': name,

        'ignorable': true
    };
}

exports.fetch = function(dbot) {
    return puns(dbot);
};
