var youAre = function(dbot) {
    var dbot = dbot;

    return {
        'listener': function(data) {
            var num = Math.floor(Math.random()*11);
            var key = data.message.match(/ is|are ([\d\w\s']*),?\.?and?/);

            if(num == 1 && key != undefined) {
                dbot.say(data.channel, data.user + ': You\'re ' + key[1]);
            }
        },

        'on': 'PRIVMSG'
    };
};

exports.fetch = function(dbot) {
    return youAre(dbot);
};
