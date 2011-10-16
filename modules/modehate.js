var modehate = function(dbot) {
    var dbot = dbot;

    return {
        'listener': function(data, params) {
            console.log(data.raw[0].indexOf('-o');
            if(dbot.db.modehate.include(data.user) && data.raw[0].indexOf('-o') != -1) {
                dbot.instance.send('KICK #42 ' + data.user + ' :gtfo');
            }
        },

        'on': 'MODE'
    };
};

exports.fetch = function(dbot) {
    return modehate(dbot);
};
