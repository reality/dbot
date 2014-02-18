/**
 * Module Name: UDP 
 * Description: Relays UDP packets, intended for
 * a feed of RecentChanges on a MediaWiki install.
 */
var dgram = require('dgram');

var udp = function(dbot) {
    var server = dgram.createSocket("udp4");
    server.on("message", function(msg, msginfo) {
        var message = msg.toString();
        console.log(message);
        if (msginfo.address == this.config.address) {
            dbot.say(this.config.server, this.config.channel, message);
        }
    }.bind(this));
    server.bind(this.config.port);
};

exports.fetch = function(dbot) {
    return new udp(dbot);
};
