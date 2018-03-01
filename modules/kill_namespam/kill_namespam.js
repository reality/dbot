/**
 * Module name: kill_namespam
 * Description: destroy those wot hilight too many nicks at once . usually
 * advertising their rubbish irc server (do not)
 */

var _ = require('underscore')._;

var kill_namespam = function(dbot) {
    this.saveConfig = function() { // eugh
      dbot.customConfig.modules.kill_namespam = this.config;
      dbot.modules.admin.internalAPI.saveConfig();
    }.bind(this);

    this.listener = function(event) {
        // Here we listen for atropos
        if(event.channel == this.config.cliconn_channel) {
          if(event.message.match('▶')) {
            var matchedPattern = _.find(this.config.cliconn_patterns, function(p) { return event.message.match(p); }) 
            if(matchedPattern) {
              var ip = event.message.split(' ')[1]

              // Alternatively you can just do dbot.api.kick.kill(event.server, event.user, message);
              dbot.say(event.server, 'operserv', 'akill add *@'+ ip +' !P Naughty Nelly Auto-kill v6.2. Matched pattern: /'+ matchedPattern +'/');

              var msg = dbot.t('clikill_act', {
                'ip': ip,
                'pattern': matchedPattern
              });
              event.reply(msg);
              dbot.api.report.notify('autokill', event.server, event.rUser,
                dbot.config.servers[event.server].admin_channel, msg, ip, ip);
            }
          }
        }

        // This is the namespam
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
        this.saveConfig();
        event.reply('Users daring to utter the above to be classified as spam.');
      },

      '~del_spamkill': function(event) {
        this.config.advert_content = _.without(this.config.advert_content, event.params.slice(1).join(' '));
        this.saveConfig();
        event.reply('Users will no longer be killed for this utterance.');
      },

      '~add_clikill': function(event) {
        var pattern = event.params.slice(1).join(' ');
        this.config.cliconn_patterns.push(pattern);
        this.saveConfig();
        event.reply('Client connection notices matching pattern /'+ pattern +'/ shall henceforth get rekt.');
      },

      '~del_clikill': function(event) {
        var pattern = event.params.slice(1).join(' ');
        this.config.cliconn_patterns = _.without(this.config.cliconn_patterns, pattern);
        this.saveConfig();
        event.reply('Client connection notices matching pattern /'+ pattern +'/ will no longer get rekt.');
      },

      '~list_clikill': function(event) {
        event.reply('Currently active "cliconn" kills (to use add/del, provide the pattern, not the index, and do not include the surrounding //');
        _.each(this.config.cliconn_patterns, function(pattern, i) {
          event.reply('['+i+'] /' + pattern + '/');
        });
      }
    };

    _.each(this.commands, function(c) {
      c.access = 'moderator';
    });
};

exports.fetch = function(dbot) {
    return new kill_namespam(dbot);
};
