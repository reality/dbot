/**
 * Module Name: UDP 
 * Description: Relays UDP packets, intended for
 * a feed of RecentChanges on a MediaWiki install.
 */
var dgram = require('dgram');

var udp = function(dbot) {
  var servers = [];

  _.each(dbot.config.modules.udp.servers, function(data) {
    var server = dgram.createSocket("udp4");

    server.on("message", function(msg, msginfo) {
        var message = msg.toString();
        if (msginfo.address == data.address) {
            dbot.say(data.server, data.channel, message);
        }
    }.bind(this));
  });

  this.onLoad = function() {
    _.each(servers, function(server) {
      server.bind(data.port);
    });
  }.bind(this);
};

exports.fetch = function(dbot) {
    return new udp(dbot);
};
