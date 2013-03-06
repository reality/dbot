/**
 * Module Name: RC
 * Description: Relays UDP packets, intended for
 * a feed of RecentChanges on a MediaWiki install.
 */
var dgram = require('dgram');

var rc = function(dbot) {
    var server = dgram.createSocket("udp4");

    server.on("message", function(msg, rinfo) {
        var message = msg.toString();
        console.log(message);
    //  dbot.say(dbot.config.rc.server, dbot.config.rc.channel, message);
    });

    server.bind(dbot.config.rc.port);
};

exports.fetch = function(dbot) {
    return new rc(dbot);
};
