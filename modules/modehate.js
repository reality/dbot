var modehate = function(dbot) {
    var dbot = dbot;

    return {
        'listener': function(data) {
            if(dbot.db.modehate.include(data.user)) {
                dbot.instance.send('KICK', data.channel, data.user, 'gtfo')
            }
        },

        on: 'MODE'
    };
};

exports.fetch = function(dbot) {
    return modehate(dbot);
};
