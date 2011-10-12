var js = function(dbot) {
    var dbot = dbot;

    var commands = {
        '~js': function(data, params) {
            var q = data.message.valMatch(/^~js ([\d\w\s]*)/, 2);
            dbot.say(data.channel, eval(q[1]));
        }
    };

    return {
        'onLoad': function() {
            return commands;
        }
    };
};

exports.fetch = function(dbot) {
    return js(dbot);
};
