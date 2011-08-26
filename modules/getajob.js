var getAJob = function(dbot) {
    var dbot = dbot;

    return {
        'listener': function(data) {
            if(Number.prototype.chanceIn(1, 50)) {
                dbot.say(data.channel, data.user + ': Get a job!');
            }
        },

        'on': 'PRIVMSG'
    };
};

exports.fetch = function(dbot) {
    return getAJob(dbot);
};
