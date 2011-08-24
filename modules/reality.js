var reality = function(dbot) {
    var dbot = dbot;

    return {
        'listener': function(data, params) {
            if(data.user == 'reality') {
                var once = data.message.match(/^I ([\d\w\s,]* once)/);
            } else {
                var once = data.message.match(/^reality ([\d\w\s,]* once)/);
            }

            if(once != null) {
                dbot.db.realiPuns.push('reality ' + once[1] + '.');
                dbot.instance.say(data.channel, '\'reality ' + once[1] + '.\' saved.');
                dbot.save();
            }
        },

        'on': 'PRIVMSG'
    };
}

exports.fetch = function(dbot) {
    return reality(dbot);
}
