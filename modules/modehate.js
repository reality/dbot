var modehate = function(dbot) {
    var dbot = dbot;

    return {
        'listener': function(data, params) {
            console.log(typeof(data.raw[0]));
            console.log(data.raw[0]);
            if(dbot.db.modehate.include(data.user) && data.raw.indexOf('-o') != -1) {
                dbot.instance.send('KICK #42 ' + data.user + ' :gtfo');
            }
        },

        'on': 'MODE'
    };
};

exports.fetch = function(dbot) {
    return modehate(dbot);
};
