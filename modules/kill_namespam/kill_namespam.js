/**
 * Module name: kill_namespam
 * Description: destroy those wot hilight too many nicks at once . usually
 * advertising their rubbish irc server (do not)
 */

var _ = require('underscore')._;

var kill_namespam = function(dbot) {
    this.listener = function(event) {
        if(event.channel == event.user) return; // return if pm
        if(_.includes(this.config.exempt, event.user)) return;

        var message;
        var naughty = false;

        // Check distinctive spam content match
        if(_.any(this.config.advert_content, function(spam) { return event.message.indexOf(spam) != -1; })) {
          message = dbot.t('spamcont_act', {
            'user': event.user,
            'channel': event.channel,
            'action': this.config.action
          });
          naughty = true;
        }

        // Name highlight spam
        if(_.filter(event.message.split(' '), function(word) { return _.has(event.channel.nicks, word); }).length > this.config.sensitivity) {
          message = dbot.t('namespam_act', {
            'user': event.user,
            'channel': event.channel,
            'action': this.config.action,
            'sensitivity': this.config.sensitivity
          });
          naughty = true;
        }

        if(naughty) {
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

    this.commands = {
      '~add_spamkill': function(event) {
        this.config.advert_content.push(event.params.slice(1).join(' '))
        event.reply('Users daring to utter the above to be classified as spam.');
      },

      '~del_spamkill': function(event) {
        this.config.advert_content = _.without(this.config.advert_content, event.params.slice(1).join(' '));
        event.reply('Users will no longer be killed for this utterance.');
      }
    };

    _.each(this.commands, function(c) {
      c.access = 'moderator';
    });
};

exports.fetch = function(dbot) {
    return new kill_namespam(dbot);
};
