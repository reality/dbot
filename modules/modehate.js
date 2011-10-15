var modehate = function(dbot) {
    var dbot = dbot;

    return {
        'listener': function(data, params) {
            console.log('caught modehate');
            console.log(params[0]);
            console.log(params[1]);
            console.log(params[2]);
            console.log(params[3]);
            console.log(params[4]);
            //if(dbot.db.modehate.include(data.user)) {
                //dbot.instance.send('KICK #42 ' + data.user + ' :gtfo');
            //}
        },

        'on': 'MODE'
    };
};

exports.fetch = function(dbot) {
    return modehate(dbot);
};
