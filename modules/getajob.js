var getAJob = function(dbot) {
    var dbot = dbot;

    return {
        'listener': function(data) {
            var num = Math.floor(Math.random()*101);
            console.log(num);
            if(num == 50 || data.message.indexOf('bored') !== -1) {
                dbot.say(data.channel, data.user + ': Get a job!');
            }
        },

        'on': 'PRIVMSG'
    };
};

exports.fetch = function(dbot) {
    return getAJob(dbot);
};
