var nickserv = function(dbot) {
    this.authStack = {};

    this.api = {
        'auth': function(server, nick, callback) {
            var nickserv = dbot.config.servers[server].nickserv,
                infoCommand = this.config.servers[server].infoCommand;

            if(!_.has(this.authStack, server)) this.authStack[server] = {};
            this.authStack[server][nick] = callback;

            dbot.say(server, nickserv, infoCommand + ' ' + nick);
        }
    };

    this.listener = function(event) {
        var nickserv = dbot.config.servers[event.server].nickserv,
            statusRegex = this.config.servers[event.server].matcher,
            acceptableState = this.config.servers[event.server].acceptableState;

        if(event.user == nickserv) {
            var info = event.params.match(statusRegex);
            if(info && _.has(this.authStack, event.server)) {
                if(info[2] == acceptableState ) {
                    this.authStack[event.server][info[1]](true);
                } else {
                    this.authStack[event.server][info[1]](false);
                }
            }
        }
    }.bind(this);
    this.on = 'NOTICE';
};

exports.fetch = function(dbot) {
    return new nickserv(dbot);
};
