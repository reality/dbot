var vm = require('vm');
var sbox = require('sandbox');

var js = function(dbot) {
    var dbot = dbot;
    var s = new sbox();

    var commands = {
        '~js': function(data, params) {
            var q = data.message.valMatch(/^~js (.*)/, 2);
            s.run(q[1], function(output) {
                dbot.say(data.channel, output.result);
            });
        },

        '~ajs': function(data, params) {
            var q = data.message.valMatch(/^~ajs (.*)/, 2);
            if(dbot.admin.include(data.user)) {
                dbot.say(data.channel, eval(q[1]));
            }
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
