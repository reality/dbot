/**
 * Module Name: JS
 * Description: Allows users to run sandboxed JS code, printing the result in
 * the channel. Also allows admins to run un-sandboxed Javascript code with
 * access to the DepressionBot instance memory.
 */
var vm = require('vm');
var sbox = require('sandbox');

var js = function(dbot) {
    var s = new sbox();

    var commands = {
        // Run JS code sandboxed, return result to channel.
        '~js': function(event) {
            try {
                s.run(event.input[1], function(output) {
                    event.reply(output.result);
                }.bind(this));
            } catch(err) {}
        },

        // Run JS code un-sandboxed, with access to DBot memory (admin-only).
        '~ajs': function(event) {
            if(dbot.config.admins.include(event.user) ) {
                var ret = eval(event.input[1]);
                if(ret !== undefined) {
                    event.reply(ret);
                }
            }
        },
        'jesus': function (event) {
            event.reply(event.user + ": s/(.)(.)(.)(..)/\4\2 \1\3/")
        }
    };
    commands['~js'].regex = [/^~js (.*)/, 2];
    commands['~ajs'].regex = [/^~ajs (.*)/, 2];
    commands['jesus'].regex = [/^jesus$/, 2];

    return {
        'name': 'js',
        'ignorable': true,
        'commands': commands
    };
};

exports.fetch = function(dbot) {
    return js(dbot);
};
