var fs = require('fs'),
    _ = require('underscore')._;

var vitetris = function(dbot) {
  var lastLine = 0;

  this.onLoad = function() {
    dbot.api.timers.addTimer(15000, function() {
      var file = fs.readFileSync(this.config.logFile).toString().split("\n");
      var newEvents = [];

      if(file.length != lastLine) {
        newEvents = file.slice(lastLine-1);
      }
      lastLine = file.length;

      if(lastLine != 0 && newEvents.length > 0) {
        _.each(newEvents, function(msg) {
          var match = msg.match(/([^ ]+) vs\. ([^ ]+) (\d)-(\d)/);
          if(match) {
            if(match[3] > match[4]) {
              dbot.say(this.config.streamServer, this.config.streamChannel, match[1] + ' beat ' + match[2] + ' at tetris ('+match[3] + '-'+match[4]+')');
            } else {
              dbot.say(this.config.streamServer, this.config.streamChannel, match[2] + ' beat ' + match[1] + ' at tetris ('+match[4] + '-'+match[3]+')');
            }
          }
        }.bind(this));
      } 
    }.bind(this));
  }.bind(this);
};

exports.fetch = function(dbot) {
  return new vitetris(dbot);
};
