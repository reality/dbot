/**
 * Name: Log
 * Description: Log commands to a channel.
 */
var _ = require('underscore')._,
    process = require('process');

var log = function(dbot) {
    this.ignoredCommands = [];

    this.api = {
        'log': function(server, user, message) {
            var logChannel = this.config.logChannel[server];
            dbot.say(server, logChannel, dbot.t('log_message', {
                'time': new Date().toUTCString(),
                'command': message,
                "channel": 'nochan',
                'user': user
            }));
        },

        'logError': function(server, err) {
            var stack = err.stack.split('\n').slice(1, dbot.config.debugLevel + 1),
                logChannel = this.config.logChannel[server],
                time = new Date().toUTCString();

            dbot.say(server, logChannel, dbot.t('error_message', {
                'time': time,
                'error': 'Message: ' + err
            })); 

            _.each(stack, function(stackLine, index) {
                dbot.say(server, logChannel, dbot.t('error_message', {
                    'time': time,
                    'error': 'Stack[' + index + ']: ' +
                        stackLine.trim()
                }));
            });
        },

        'ignoreCommand': function(commandName) {
            this.ignoredCommands.push(commandName);    
        }
    };

    this.onLoad = function() {
        dbot.api.event.addHook('command', function(event) {
            var logChannel = this.config.logChannel[event.server];
                channel = event.channel.name || 'PM';
            if(logChannel && !_.include(this.ignoredCommands, event.message.split(' ')[0])) {
                dbot.say(event.server, logChannel, dbot.t('log_message', {
                    'time': new Date().toUTCString(),
                    'channel': channel,
                    'command': event.message,
                    'user': event.user
                }));
            }
        }.bind(this));

        process.on('uncaughtException', function(err) {
            console.log(err);
            _.each(this.config.logChannel, function(chan, server) {
                this.api.logError(server, err); 
            }, this);
            process.exit(1);
        }.bind(this));
    }.bind(this);
};

exports.fetch = function(dbot) {
    return new log(dbot);
};
