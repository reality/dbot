/**
 * Module name: kill_namespam
 * Description: destroy those wot hilight too many nicks at once . usually
 * advertising their rubbish irc server (do not)
 */

var _ = require('underscore')._;

var kill_namespam = function(dbot) {
    this.listener = function(event) {
        if(event.channel == event.user) return; // return if pm
        if(_.filter(event.message.split(' '), function(word) { return _.has(event.channel.nicks, word); }.length > this.config.sensitivity)) {
          var message = dbot.t('namespam_act', {
            'user': event.user,
            'channel': event.channel,
            'action': this.config.action,
            'sensitivity': this.config.sensitivity
          });

          switch(this.config.action) {
            case 'kickban': 
              dbot.api.kick.ban(event.server, event.host, event.channel);
              dbot.api.kick.kick(event.server, event.user, message);
              break;
            case 'kill':
              dbot.api.kick.kill(event.server, event.user, message);
            default: break;
          }

          dbot.api.report.notify('spam', event.server, event.user, event.channel, message, event.host, event.user);
        }
    }.bind(this);
    this.on = 'PRIVMSG';
};

exports.fetch = function(dbot) {
    return new kill_namespam(dbot);
};
