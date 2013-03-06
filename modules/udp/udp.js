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
        if (msginfo.address == dbot.config.udp.address) {
            dbot.say(dbot.config.udp.server, dbot.config.udp.channel, message);
        }
    });
    server.bind(dbot.config.udp.port);
};

exports.fetch = function(dbot) {
    return new udp(dbot);
};
