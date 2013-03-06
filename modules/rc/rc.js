/**
 * Module Name: Link
 * Description: Stores recent channel rcs, with commands to retrieve
 * information about rcs.
 */
var dgram = require('dgram');

var rc = function(dbot) {
    var server = dgram.createSocket("udp4");

    server.on("message", function(msg, rinfo) {
        console.log(msg.toString());
    });

    server.bind(dbot.config.rc.port);

                
    var commands = {
    };
    this.commands = commands;

    this.on = 'PRIVMSG';
};

exports.fetch = function(dbot) {
    return new rc(dbot);
};
