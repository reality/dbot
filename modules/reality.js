var reality = function(dbot) {
    var dbot = dbot;

    return {
        'listener': function(data, params) {
            // Ternary for I/reality doesn't seem to work with the regex. Investigate.
            if(data.user == 'reality') {
                var once = data.message.valMatch(/^I ([\d\w\s,'-]* once)/, 2);
            } else {
                var once = data.message.valMatch(/^reality ([\d\w\s,'-]* once)/, 2);
            }

            if(once) {
                dbot.db.quoteArrs['realityonce'].push('reality ' + once[1] + '.');
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
