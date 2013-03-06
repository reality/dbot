/**
 * Module Name: Finger 
 * Description: Returns the name of users via the Finger protocol
 */
var request = require('request'),
    _ = require('underscore')._,
    exec = require('child_process').exec;

var finger = function(dbot) {
    var commands = {
        '~finger': function(event) {
            var username = event.params[1];
            exec("finger -s " + username + "@central.aber.ac.uk",function(error,stdout,stderr){
                name = stdout.search("Name:");
                stdout = stdout.substring(name);
                ret = stdout.search("Dir");
                stdout = stdout.substring(0,ret);
                event.reply(stdout);
            });
        }
    };
    this.commands = commands;

    this.on = 'PRIVMSG';
};

exports.fetch = function(dbot) {
    return new finger(dbot);
};
