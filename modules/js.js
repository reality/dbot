var js = function(dbot) {
    var dbot = dbot;

    var commands = {
        '~js': function(data, params) {
            var q = data.message.valMatch(/^~q ([\d\w\s]*)/, 2);
            dbot.say(data.channel, eval(q));
        }
    };
}
