/**
 * Module Name: charybdis
 * Description: charybdis and atheme mode references
 */
var _ = require('underscore')._;

var charybdis = function(dbot) {
    this.commands = {
        '~chanserv': function(event) {
            if(_.has(this.config.chanserv, event.input[1])) {
                event.reply('ChanServ flag ' + event.input[1] + ': ' + this.config.chanserv[event.input[1]]);
            } else {
                event.reply('I don\'t know anything about ' + event.input[1]);
            }
        },

        '~chanmode': function(event) {
            if(_.has(this.config.chanmodes, event.input[1])) {
                event.reply('Channel Mode ' + event.input[1] + ': ' + this.config.chanmodes[event.input[1]]);
            } else {
                event.reply('I don\'t know anything about ' + event.input[1]);
            }
        }
    };
    this.commands['~chanserv'].regex = [/^chanserv (\+.)/, 2]
    this.commands['~chanmode'].regex = [/^chanmode (\+.)/, 2]
};

exports.fetch = function(dbot) {
    return new charybdis(dbot);
};
