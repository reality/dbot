var vm = require('vm');
var sbox = require('sandbox');

var js = function(dbot) {
    var dbot = dbot;
    var s = new sbox();

    var commands = {
        '~js': function(event) {
            console.log('hello');
            var q = event.message.valMatch(/^~js (.*)/, 2);
            s.run(q[1], function(output) {
                event.reply(output.result);
            }.bind(this));
        },

        '~ajs': function(event) {
            var q = data.message.valMatch(/^~ajs (.*)/, 2);
            if(dbot.admin.include(data.user) ) {
                var ret = eval(q[1]);
                if(ret != undefined) {
                    event.reply(ret);
                }
            }
        }
    };

    return {
        'onLoad': function() {
            return commands;
        },

        'name': 'js',

        'ignorable': true 
    };
};

exports.fetch = function(dbot) {
    return js(dbot);
};
