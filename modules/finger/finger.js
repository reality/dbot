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
            exec("finger -s " + username + "@" + dbot.config.finger.server,function(error,stdout,stderr){
                stdout = stdout.replace(/(\r\n|\n|\r)/gm,"");
                name = stdout.search("Name:");
                stdout = stdout.substring(name);
                ret = stdout.search("Dir");
                stdout = stdout.substring(6,ret);
                if (stdout == "Welcom") {
                    event.reply(dbot.t("nonexistent",{user: username}));
                } else {
                    event.reply(dbot.t("name",{user: username, name: stdout}));
                }
            });
        }
    };
    this.commands = commands;

    this.on = 'PRIVMSG';
};

exports.fetch = function(dbot) {
    return new finger(dbot);
};
