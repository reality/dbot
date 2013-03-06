/**
 * Module Name: RC
 * Description: Relays UDP packets, intended for
 * a feed of RecentChanges on a MediaWiki install.
 */
var dgram = require('dgram');

var rc = function(dbot) {
    var server = dgram.createSocket("udp4");
    server.on("message", function(msg, msginfo) {
        var message = msg.toString();
        console.log(message);
        if (msginfo.address == dbot.config.rc.address) {
            dbot.say(dbot.config.rc.server, dbot.config.rc.channel, message);
        }
    });
    server.bind(dbot.config.rc.port);
};

exports.fetch = function(dbot) {
    return new rc(dbot);
};
