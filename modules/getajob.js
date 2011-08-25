var getAJob = function(dbot) {
    var dbot = dbot;

    return {
        'listener': function(data) {
            var num = Math.floor(Math.random()*101);
            if(num == 50) {
                dbot.say(data.channel, data.user + ': Get a job!');
            }
        },

        'on': 'PRIVMSG'
    };
};

exports.fetch = function(dbot) {
    return getAJob(dbot);
};
