var puns = function(dbot) {
    var dbot = dbot;

    return {
        'listener': function(data) {
            if(data.user == dbot.name) return;
            if(dbot.moduleNames.include('quotes')) {
                if(dbot.db.quoteArrs.hasOwnProperty(data.user.toLowerCase())) {
                    data.message = '~q ' + data.user.toLowerCase();
                    var params = data.message.split(' ');
                    dbot.commands[params[0]](data, params);
                }
            }
        },

        'on': 'JOIN'
    };
}

exports.fetch = function(dbot) {
    return puns(dbot);
};
