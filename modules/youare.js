var youAre = function(dbot) {
    var dbot = dbot;

    return {
        'listener': function(data) {
            var num = Math.floor(Math.random()*6);
            var key = data.message.match(/(is|are) ([\d\w\s']*),?\.?/);

            if(num == 1 && key != undefined) {
                if(key[2].indexOf('and') !== -1) {
                    key[2] = key[2].split('and')[0];
                } // TODO: fix the regex to do this. i hate regex

                dbot.say(data.channel, data.user + ': You\'re ' + key[2]);
            }
        },

        'on': 'PRIVMSG'
    };
};

exports.fetch = function(dbot) {
    return youAre(dbot);
};
