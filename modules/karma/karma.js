/**
 * Module Name: Karma
 * Description: Thanking, with Karma!
 */
var _ = require('underscore')._;

var karma = function(dbot) {
  this.lastKarma = {};

  this.internalAPI = {
    'getKarma': function(item, callback) {
      this.db.read('karma', item.toLowerCase(), callback);
    }.bind(this),

    'setKarma': function(item, value, callback) {
      this.db.save('karma', item.toLowerCase(), {
        'item': item.toLowerCase(),
        'karma': value
      }, callback);
    }.bind(this)
  };

  this.commands = {
    'karma': function(event) {
      var item = event.params[1] || event.user;
      this.internalAPI.getKarma(item, function(err, karma) {
        if(!err && karma) {
          karma = karma.karma;
        } else {
          karma = 0;
        }

        event.reply(dbot.t('karma', {
          'item': item,
          'karma': karma
        }));
      });
    },

    'setkarma': function(event) {
      var item = event.params[1],
        value = parseInt(event.params[2]);

      this.internalAPI.setKarma(item, value, function(err, karma) {
        event.reply(dbot.t('newkarma', {
          'item': item,
          'value': value
        }));
      });
    }, 

    'unkarmaiest': function(event) {
      var karmas = {};
      this.db.scan('karma', function(karma) {
        if(karma && !_.isUndefined(karma.item)) {
          karmas[karma.item] = karma.karma;
        }
      }.bind(this), function(err) {
        var qSizes = _.chain(karmas)
          .pairs()
          .sortBy(function(category) { return category[1]; })
          .first(10)
          .value();

        var qString = 'Unkarmaiest: ';
        for(var i=0;i<qSizes.length;i++) {
          qString += qSizes[i][0] + " (" + qSizes[i][1] + "), ";
        }

        event.reply(qString.slice(0, -2));
      });
    },

    'karmaiest': function(event) {
      var karmas = {};
      this.db.scan('karma', function(karma) {
        if(karma && !_.isUndefined(karma.item)) {
          karmas[karma.item] = karma.karma;
        }
      }.bind(this), function(err) {
        var qSizes = _.chain(karmas)
          .pairs()
          .sortBy(function(category) { return category[1]; })
          .reverse()
          .first(10)
          .value();

        var qString = 'Karmaiest: ';
        for(var i=0;i<qSizes.length;i++) {
          qString += qSizes[i][0] + " (" + qSizes[i][1] + "), ";
        }

        event.reply(qString.slice(0, -2));
      });
    },

    'wattest': function(event) {
      var karmas = {};
      this.db.scan('karma', function(karma) {
        if(karma && !_.isUndefined(karma.item)) {
          if(karma.item.match(/_wat$/)) {
            karmas[karma.item] = karma.karma;
          }
        }
      }.bind(this), function(err) {
        var qSizes = _.chain(karmas)
          .pairs()
          .sortBy(function(category) { return category[1]; })
          .reverse()
          .first(10)
          .value();

        var qString = 'Karmaiest: ';
        for(var i=0;i<qSizes.length;i++) {
          qString += qSizes[i][0] + " (" + qSizes[i][1] + "), ";
        }

        event.reply(qString.slice(0, -2));
      });
    }

  };
  this.commands.setkarma.access = 'admin';

  this.listener = function(event) {
    dbot.api.ignore.isUserBanned(event.rUser, 'karma', function(isBanned) {
      if(!isBanned) {
        var match = event.message.match(/^(.+)(\+\+|\-\-)$/);
        if(event.user !== dbot.config.name && match && match[1].length < 25) {
          match[1] = match[1].replace(/(\+|\-)/g,'').replace(/:/g,'').trim();

          var timeout = 5000;
         /* if(event.channel.name == '#stims' || event.channel.name == '##meth' || event.channel.name == '##sweden') {
            timeout = 20000;
          }*/
          if(_.has(this.lastKarma, event.rUser.id) && this.lastKarma[event.rUser.id]+ timeout > Date.now()) {
            return event.reply('Try again in a few seconds : - )');
          } else if(event.rUser.currentNick.toLowerCase() === match[1].toLowerCase() || event.rUser.primaryNick.toLowerCase() === match[1].toLowerCase()) {
            return event.reply('Stop playing with yourself : - )');
          } else if(event.channel == event.user) {
            return event.reply('Don\'t be a Secretive Sally : - )');
          }

          if(event.channel.name == '##wat') {
            match[1] = match[1].replace(/_wat$/, '');
            match[1] += '_wat';
          }

          this.internalAPI.getKarma(match[1], function(err, karma) {
            if(!karma) {
              karma = 0;
            } else {
              karma = karma.karma;
            }

            if(match[2] === '--') {
              if(match[1].toLowerCase() =='weed') {
                karma -= 2; 
              } else {
                karma -= 1;
              }
            } else {
              if(match[1].toLowerCase() == 'weed') {
                karma += 2;
              } else {
                karma += 1;
              }
            }

            this.internalAPI.setKarma(match[1], karma, function(err, karma) {
              this.lastKarma[event.rUser.id] = Date.now(); 
              var pre;
              if(karma.karma > 0) {
                pre = '[\u00039karma\u000f]';
                karma.karma = '\u00039 '+karma.karma+'\u000f';
              } else if(karma.karma < 0) {
                pre = '[\u00034karma\u000f]';
                karma.karma = '\u00034 '+karma.karma+'\u000f';
              } else {
                pre = '[\u00036karma\u000f]';
                karma.karma = '\u00036 '+karma.karma+'\u000f';
              }
              event.reply(pre + ' ' + dbot.t('newkarma', {
                'item': match[1],
                'value': karma.karma 
              }));
              if(_.has(dbot.modules, 'log')) {
                dbot.api.log.logWithChannel(event.server, event.channel, event.rUser.primaryNick, event.message);
              }
            }.bind(this));
          }.bind(this));
        }
      }
    }.bind(this));
  }.bind(this);
  this.on = 'PRIVMSG';
};

exports.fetch = function(dbot) {
  return new karma(dbot);
};
