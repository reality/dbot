/**
 * Name: Announce
 * Description: Announce things every now and again
 */
var _ = require('underscore')._;

var announce = function(dbot) {
    this.announces = dbot.config.modules.announce.announces;
    this.lineCount = 0;
    this.lastAnnounce = {};
    _.each(dbot.config.servers, function(v, k) {
        this.lastAnnounce[k] = {};
        _.each(this.announces[k], function(announce, channel) {
            this.lastAnnounce[k][channel] = announce.distance;
        }, this)
    }, this);

    this.listener = function(event) {
        if(_.has(this.lastAnnounce[event.server], event.channel)) { 
            this.lastAnnounce[event.server][event.channel]--;
            if(this.lastAnnounce[event.server][event.channel] == 0) {
                var announce = this.config.announces[event.server][event.channel];
                this.lastAnnounce[event.server][event.channel] = announce.distance;

                dbot.api.quotes.getQuote(announce.category, function(quote) {
                    if(quote) {
                        dbot.say(event.server, event.channel, quote);
                    }
                }); 
            }
        }
    }.bind(this);
    this.on = 'PRIVMSG';
};

exports.fetch = function(dbot) {
    return new announce(dbot);
};
