var _ = require('underscore')._;

var nickserv = function(dbot) {
    this.authStack = {};
    this.userStack = {};

    this.api = {
        'auth': function(server, nick, callback) {
            var nickserv = dbot.config.servers[server].nickserv,
                infoCommand = this.config.servers[server].infoCommand;

            if(!_.has(this.authStack, server)) this.authStack[server] = {};
            this.authStack[server][nick] = callback;
            dbot.say(server, nickserv, infoCommand + ' ' + nick + ' *');
        },

        'getUserHost': function(server, nick, callback) {
            if(!_.has(this.userStack, server)) this.userStack[server] = {};
            this.userStack[server][nick] = callback;
            dbot.instance.connections[server].send('USERHOST ' + nick);
            setTimeout(function() {
                if(_.has(this.userStack[server], nick)) {
                    dbot.instance.connections[server].send('WHOWAS ' + nick);
                    setTimeout(function() {
                        if(_.has(this.userStack[server], nick)) {
                            callback(false); 
                        }
                    }.bind(this), 4000);
                }
            }.bind(this), 4000);
        }
    };

    this.commands = {
        '~auth': function(event) {
            var user = event.params[1] || event.user;
            this.api.auth(event.server, user, function(isAuthed, account) {
                if(isAuthed) {
                    if(user == account) {
                        event.reply(dbot.t('authed', { 'nick': user })); 
                    } else {
                        event.reply(dbot.t('authed_as', { 
                            'nick': user,
                            'account': account
                        })); 
                    }
                } else {
                    event.reply(dbot.t('not_authed', { 'nick': user })); 
                }
            });
        },

        '~hostmask': function(event) {
            var user = event.params[1] || event.user;
            this.api.getUserHost(event.server, user, function(host) {
                if(host) {
                    event.reply(dbot.t('hostmask', {
                        'nick': user,
                        'host': host
                    }));
                } else {
                    event.reply(dbot.t('no_hostmask', { 'nick': user }));
                }
            });
        }
    };

    this.listener = function(event) {
        if(event.action == 'NOTICE') {
            var nickserv = dbot.config.servers[event.server].nickserv,
                statusRegex = this.config.servers[event.server].matcher,
                acceptableState = this.config.servers[event.server].acceptableState;

            if(event.user == nickserv) {
                var info = event.params.match(statusRegex);
                if(info && _.has(this.authStack, event.server)) {
                    if(info[3] == acceptableState) {
                        this.authStack[event.server][info[1]](true, info[2]);
                    } else {
                        this.authStack[event.server][info[2]](false, info[2]);
                    }
                }
            }
        } else if(event.action == '302') {
            var match = event.params.match(/:(.+)=([^@]+)@(.+)$/);

            if(match && match[1]) match[1] = match[1].replace('\*', '');
            if(match && _.has(this.userStack, event.server) && _.has(this.userStack[event.server], match[1])) {
                var callback = this.userStack[event.server][match[1]];
                delete this.userStack[event.server][match[1]];
                callback(match[3].trim());
            }
        } else if(event.action == '314') {
            var params = event.params.split(' '),
                nick = params[1],
                host = params[3];

            if(_.has(this.userStack, event.server) && _.has(this.userStack[event.server], nick)) {
                var callback = this.userStack[event.server][nick];
                delete this.userStack[event.server][nick];
                callback(host);
            }
        }
    }.bind(this);
    this.on = ['NOTICE', '302', '314'];
};

exports.fetch = function(dbot) {
    return new nickserv(dbot);
};
