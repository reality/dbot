var _ = require('underscore')._;

var quotes = function(dbot) {
    dbot.sessionData.rmCache = [];
    this.quotes = dbot.db.quoteArrs,
    this.addStack = [],
    this.rmAllowed = true,
    this.rmCache = dbot.sessionData.rmCache,
    this.rmTimer;

    this.internalAPI = {
        'interpolatedQuote': function(server, channel, key, quote, callback) {
            // Parse quote interpolations
            var quoteRefs = quote.match(/~~([\d\w\s-]*)~~/g);
            if(quoteRefs) {
                var ref = dbot.cleanNick(quoteRefs[0].replace(/^~~/,'').replace(/~~$/,'').trim());
                if(ref === '-nicks-') {
                    dbot.api.users.getRandomChannelUser(server, channel, function(user) {
                        quote = quote.replace('~~' + ref + '~~', randomNick);
                        this.internalAPI.interpolatedQuote(server, channel, key, quote, callback);
                    }.bind(this));
                } else {
                    this.api.getQuote(ref, function(interQuote) {
                        if(!interQuote || ref == key) {
                            interQuote = '';
                        }
                        quote = quote.replace('~~' + ref + '~~', interQuote);
                        this.internalAPI.interpolatedQuote(server, channel, key, quote, callback);
                    }.bind(this));
                }
            } else {
                callback(quote);
            }
        }.bind(this),

        'resetRemoveTimer': function(event, key, quote) {
            this.rmAllowed = false;
            setTimeout(function() {
                this.rmAllowed = true;
            }.bind(this), 5000);

            this.rmCache.push({
                'key': key, 
                'quote': quote
            });

            clearTimeout(this.rmTimer);
            if(this.rmCache.length < dbot.config.quotes.rmLimit) {
                this.rmTimer = setTimeout(function() {
                    this.rmCache.length = 0; // lol what
                }.bind(this), 600000);
            } else {
                _.each(dbot.config.admins, function(admin) {
                    dbot.say(event.server, admin, dbot.t('rm_cache_limit'));
                });
            }
        }.bind(this)
    };

    this.api = {
        'getQuote': function(key, callback) {
            var category = false;
            key = key.trim().toLowerCase(),

            this.db.search('quote_category', { 'name': key }, function(result) {
                category = result;
            }, function(err) {
                if(category) {
                    var quotes = category.quotes;
                    var index = _.random(0, quotes.length - 1); 
                    callback(quotes[index]);
                } else {
                    callback(false);
                }
            });
        },

        'getInterpolatedQuote': function(server, channel, key, callback) {
            key = key.trim().toLowerCase(),

            this.api.getQuote(key, function(quote) {
                this.internalAPI.interpolatedQuote(server, channel, key, quote, callback); 
            }.bind(this));
        }
    };
   
    this.listener = function(event) {
        if(event.action == 'PRIVMSG') {
            if(event.user == 'reality') {
                var once = event.message.valMatch(/^I ([\d\w\s,'-]* once)/, 2);
            } else {
                var once = event.message.valMatch(/^reality ([\d\w\s,'-]* once)/, 2);
            }

            if(once) {
                event.message = '~qadd realityonce=reality ' + once[1];
                event.action = 'PRIVMSG';
                event.params = event.message.split(' ');
                dbot.instance.emit(event);
           }
        } else if(event.action == 'JOIN') {
            var userQuote = this.api.getQuote(event, event.user)
            if(userQuote) {
                event.reply(event.user + ': ' + this.api.getQuote(event, event.user));
            }
        }
    }.bind(this);
    this.on = ['PRIVMSG', 'JOIN'];
};

exports.fetch = function(dbot) {
    return new quotes(dbot);
};
