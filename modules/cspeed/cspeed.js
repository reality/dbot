var _ = require('underscore')._;

var cspeed = function(dbot) {
    this.watches = dbot.db.cspeed;
    this.outputChannel = dbot.config.modules.cspeed.outputChannel;
    this.counts = {};

    this.api = {
      'getCounts': function(callback) {
        callback(this.counts);
      }
    };
    this.api['getCounts'].external = true;
    this.api['getCounts'].extMap = [ 'callback' ];

    this.commands = {
      'addlpmwatch': function(event) {
        var channel = event.params[1];
        var key = event.server + '.' + channel;

        if(!_.has(this.watches, key)) {
          this.watches[key] = {
            'server': event.server,
            'channel': channel
          }; // to be extended with warn nums etc

          this.counts[key] = 0;
          dbot.api.timers.addTimer(60000, function() {
            dbot.say(event.server, this.outputChannel, channel + ' currently : ' + this.counts[key] + ' LPM');
            this.counts[key] = 0;
          }.bind(this));

          event.reply('Added speed watch for ' + channel);
        } else {
          event.reply('Already watching that channel');
        }
      }
    };

    this.listener = function(event) {
      var key = event.server + '.' + event.channel;
      if(_.has(this.watches, key)) {
        this.counts[key]++;
      }
    }.bind(this);
    this.on = 'PRIVMSG';

    this.onLoad = function() {
      var watches = dbot.db.cspeed;
      _.each(watches, function(watch) {
        var key = watch.server + '.' + watch.channel;
        this.counts[key] = 0;
        dbot.api.timers.addTimer(60000, function() {
          dbot.say(watch.server, dbot.db.cspeed.outputChannel, watch.channel + ': ' + this.counts[key] + 'LPM');
        }.bind(this));
      }.bind(this));
    }.bind(this);
};

exports.fetch = function(dbot) {
    return new cspeed(dbot);
};
