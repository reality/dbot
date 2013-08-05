var _ = require('underscore')._;

var regex = function(dbot) {
    this.last = {};
    this.listener = function(event) {
        var q = event.message.valMatch(/^([\d\w\s]*)?:? ?s\/(.+)\/(.+)?\/([ig]*)?$/, 5);
        if(q) {
            var flags = q[4],
                toMatch = new RegExp(q[2], flags),
                replaceWith = q[3],
                last,
                replacement;
                
            if(!replaceWith) replaceWith = "";

            if(q[1] != null) {
                var user = q[1];
                last = this.last[event.channel.name][user];
                replacement = last.replace(toMatch, replaceWith);
                replacement = replacement.replace("\x01", '').replace(/^.ACTION/,  user);
                if(replacement != last) event.reply(event.user + " thinks " + user + " meant: " + replacement);
            } else {
                last = this.last[event.channel.name][event.user];
                replacement = last.replace(toMatch, replaceWith);
                replacement = replacement.replace("\x01", '').replace(/^.ACTION/,  event.user);
                if(replacement != last) event.reply(event.user + " meant: " + replacement);
            }
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
