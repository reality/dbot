var modehate = function(dbot) {
    var dbot = dbot;

    return {
        'listener': function(data, params) {
            if(data.raw[0].indexOf('-oooo') != -1) {
                dbot.instance.send('KICK ' + data.channel + ' ' + data.user + ' :gtfo - mass deop protection');
            } else if(dbot.db.modehate.include(data.user) && data.raw[0].indexOf('-o') != -1) {
                dbot.instance.send('KICK ' + data.channel + ' ' + data.user + ' :gtfo');
            }
        },

        'on': 'MODE'
    };
};

exports.fetch = function(dbot) {
    return modehate(dbot);
};
