var _ = require('underscore')._,
    uuid = require('node-uuid');

var quotes = function(dbot) {
    dbot.sessionData.rmCache = [];
    this.rmCache = dbot.sessionData.rmCache;
    this.quotes = dbot.db.quoteArrs;
    this.rmAllowed = true;
    this.rmTimer;

    this.internalAPI = {
        // Parse quote interpolations
        'interpolatedQuote': function(server, channel, key, quote, callback) {
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
        'addQuote': function(key, quote, user, callback) {
             var key = key.toLowerCase().trim(),
                newCount,
                category = false;

            this.db.search('quote_category', { 'name': key }, function(result) {
                category = result;
            }, function(err) {
                if(!category) {
                    var id = uuid.v4();
                    category = {
                        'id': id,
                        'name': key,
                        'quotes': [], 
                        'owner': user
                    };
                } 

                if(_.include(category.quotes, quote)) {
                    callback(false);
                } else {
                    newCount = category.quotes.push(quote);
                    this.db.save('quote_category', category.id, category, function(err) {
                        this.rmAllowed = true;
                        callback(newCount);
                    }.bind(this));
                }
            }.bind(this));

        }, 

        'getQuote': function(key, callback) {
            this.api.getQuoteCategory(key, function(category) {
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
                if(quote) {
                    this.internalAPI.interpolatedQuote(server, channel, key, quote, callback); 
                } else {
                    callback(quote);
                }
            }.bind(this));
        },

        'getQuoteCategory': function(key, callback) {
            var category = false, 
                key = key.trim().toLowerCase();

            this.db.search('quote_category', { 'name': key }, function(result) {
                category = result;
            }, function(err) {
                callback(category);
            });
        },

        'getCategoryKeys': function(callback) {
            var keys = [];
            this.db.scan('quote_category', function(result) {
                if(result) keys.push(result.name);
            }, function(err) {
                callback(keys);
            });
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
                this.api.addQuote('realityonce', 'reality' + once[1], event.user, function(newCount) {
                    event.reply('\'reality ' + once[1] + '\' saved (' + newCount + ').');
                });
           }
        } else if(event.action == 'JOIN') {
            var userQuote = this.api.getQuote(event.user, function(quote) {
                if(quote) {
                    event.reply(event.user + ': ' + quote);
                }
            });
        }
    }.bind(this);
    this.on = ['PRIVMSG', 'JOIN'];
};

exports.fetch = function(dbot) {
    return new quotes(dbot);
};
