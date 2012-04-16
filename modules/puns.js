var puns = function(dbot) {
    var name = 'puns';
    var dbot = dbot;

    return {
        'listener': function(data) {
            if((dbot.db.ignores.hasOwnProperty(data.user) && 
                        dbot.db.ignores[data.user].include(name)) == false) {
                if(dbot.moduleNames.include('quotes') &&
                        dbot.db.quotes.hasOwnProperty(data.user)) {
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
