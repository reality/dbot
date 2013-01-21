var _ = require('underscore')._;

var regex = function(dbot) {
    this.last = {};
    this.listener = function(event) {
        var q = event.message.valMatch(/^s\/(.+)\/(.+)\/$/, 3);
        var otherQ = event.message.valMatch(/^([\d\w\s]*): s\/(.+)\/(.+)\/$/, 4);
        if(q) {
            var toMatch = new RegExp(q[1]);
            var replaceWith = q[2];
            var last = this.last[event.channel.name][event.user];
            event.reply(event.user + " meant: " + last.replace(toMatch, replaceWith));
        } else if(otherQ) {
            var user = otherQ[1]; 
            var toMatch = new RegExp(otherQ[2]);
            var replaceWith = otherQ[3];
            var last = this.last[event.channel.name][user];
            event.reply(event.user + " thinks " + user + " meant: " + last.replace(toMatch, replaceWith));
        } else {
            if(_.has(this.last, event.channel.name)) {
               this.last[event.channel.name][event.user] = event.message; 
            } else {
                this.last[event.channel.name] = { };
                this.last[event.channel.name][event.user] = event.message;
            }
        }
    }.bind(this);
    this.on = [ 'PRIVMSG' ];
};

exports.fetch = function(dbot) {
    return new regex(dbot);
};
