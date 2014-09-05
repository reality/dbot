/**
 * Module Name: charybdis
 * Description: charybdis and atheme mode references
 */
var _ = require('underscore')._;

var atheme = function(dbot) {
    this.flagStack = {};

    this.api = {
        'getChannelFlags': function(server, channel, callback) {
            if(!_.has(this.flagStack, server)) this.flagStack[server] = {};
            if(_.has(this.flagStack[server], channel)) { // Already an active flag call
                this.flagStack[server][channel].callbacks.push(callback);
            } else {
                this.flagStack[server][channel] = {
                    'flags': {},
                    'callbacks': [ callback ]
                };
            }

            dbot.say(server, 'chanserv', 'FLAGS ' + channel);
            setTimeout(function() { // Delete callback if no response
                if(_.has(this.flagStack[server], channel)) {
                    _.each(this.flagStack[server][channel].callbacks, function(callback) {
                        callback(true, null);
                    });
                    delete this.flagStack[server][channel];
                }
            }.bind(this), 10000);
        }
    };

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
    this.commands['~chanserv'].regex = [/^chanserv (\+.)/, 2];
    this.commands['~chanmode'].regex = [/^chanmode (\+.)/, 2];

    this.listener = function(event) {
        if(event.user === 'ChanServ') {
            var flags = event.params.match(/(\d+)\s+([^ ]+)\s+(\+\w+)\s+\((\#\w+)\)/),
                end = event.params.match(/end of \u0002(\#\w+)\u0002 flags listing/i);

            if(flags && _.has(this.flagStack[event.server], flags[4])) {
                this.flagStack[event.server][flags[4]].flags[flags[2]] = flags[3];
            } else if(end) {
                if(_.has(this.flagStack[event.server], end[1])) {
                    _.each(this.flagStack[event.server][end[1]].callbacks, function(callback) {
                        callback(null, this.flagStack[event.server][end[1]].flags);
                    }.bind(this));
                    delete this.flagStack[event.server][end[1]];
                }
            }
        }
    }.bind(this);
    this.on = 'NOTICE';
};

exports.fetch = function(dbot) {
    return new atheme(dbot);
};
