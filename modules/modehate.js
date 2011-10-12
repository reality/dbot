var modehate = function(dbot) {
    var dbot = dbot;

    return {
        'listener': function(data) {
            console.log('caught modehate');
            if(dbot.db.modehate.include(data.user)) {
                dbot.instance.send('KICK #42 ' + data.user + ' :gtfo');
            }
        },

        'on': 'MODE'
    };
};

exports.fetch = function(dbot) {
    return modehate(dbot);
};
