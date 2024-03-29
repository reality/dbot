/**
 * Module Name: JS
 * Description: Allows users to run sandboxed JS code, printing the result in
 * the channel. Also allows admins to run un-sandboxed Javascript code with
 * access to the DepressionBot instance memory.
 */
var VM = require('vm2').VM;

var js = function(dbot) {
    var commands = {
        // Run JS code sandboxed, return result to channel.
        '~js': function(event) {
            try {
                var s = new VM({timeout: 1000, sandbox: {}});
                event.reply(s.run(event.input[1]));                                                                                                                                                                                                                           
            } catch(err) { event.reply(err); }
        },

        // Run JS code un-sandboxed, with access to DBot memory (admin-only).
        '~ajs': function(event) {
            var callback = function() { 
                var args = Array.prototype.slice.call(arguments);
                for(var i=0;i<args.length;i++) {
                    var arg = args[i];
                    if(_.isObject(arg) && !_.isArray(arg)) {
                        arg = '[object Object]: ' + _.keys(arg).join(', ');
                    }
                    event.reply('Callback[' + i + ']: ' + arg);
                }
            };
            var ret = eval(event.input[1]);
            if(ret !== undefined) {
                event.reply(ret);
            }
        }
    };
    commands['~js'].regex = [/^js (.*)/, 2];
    commands['~ajs'].regex = [/^ajs (.*)/, 2];
    commands['~ajs'].access = 'admin';

    this.name = 'js';
    this.ignorable = true;
    this.commands = commands;
};

exports.fetch = function(dbot) {
    return new js(dbot);
};
