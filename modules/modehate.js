var modehate = function(dbot) {
    var dbot = dbot;

    return {
        'listener': function(data, params) {
            console.log('THIS: ' + data.raw[0]);
            if(data.raw[0].indexOf('-oooo') != -1) {
                console.log('test');
                console.log('KICK ' + data.channel + ' ' + data.user + ' :gtfo - mass deop protection');
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
