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
        }
    };
    this.commands.setkarma.access = 'admin';

    this.listener = function(event) {
        var match = event.message.match(/^(.+)(\+\+|\-\-)$/);
        if(event.user !== dbot.config.name && match && match[1].length < 25) {
            match[1] = match[1].replace(/(\+|\-)/g,'').replace(/:/g,'').trim();

            if(_.has(this.lastKarma, event.rUser.id) && this.lastKarma[event.rUser.id] + 5000 > Date.now()) {
                return event.reply('Try again in a few seconds : - )');
            } else if(event.rUser.currentNick.toLowerCase() === match[1].toLowerCase() || event.rUser.primaryNick.toLowerCase() === match[1].toLowerCase()) {
                return event.reply('Stop playing with yourself : - )');
            } else if(event.channel == event.user) {
                return event.reply('Don\'t be a Secretive Sally : - )');
            }

            this.internalAPI.getKarma(match[1], function(err, karma) {
                if(!karma) {
                    karma = 0;
                } else {
                    karma = karma.karma;
                }

                if(match[2] === '--') {
                    karma -= 1;
                } else {
                    karma += 1;
                }

                this.internalAPI.setKarma(match[1], karma, function(err, karma) {
                    this.lastKarma[event.rUser.id] = Date.now(); 
                    event.reply(dbot.t('newkarma', {
                        'item': match[1],
                        'value': karma.karma 
                    }));
                }.bind(this));
            }.bind(this));
        }
    }.bind(this);
    this.on = 'PRIVMSG';
};

exports.fetch = function(dbot) {
    return new karma(dbot);
};
