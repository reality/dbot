var _ = require('underscore')._,
    databank = require('databank'),
    AlreadyExistsError = databank.AlreadyExistsError,
    NoSuchThingError = databank.NoSuchThingError;

var commands = function(dbot) {
    var quotes = dbot.db.quoteArrs;
    var commands = {
        // Alternative syntax to ~q
        '~': function(event) {
            commands['~q'].bind(this)(event);
        },

        '~rmstatus': function(event) {
            var rmCacheCount = this.rmCache.length;
            if(rmCacheCount < dbot.config.quotes.rmLimit) {
                event.reply(dbot.t('quote_cache_auto_remove', 
                    { 'count': rmCacheCount }));
            } else {
                event.reply(dbot.t('quote_cache_manual_remove', 
                    { 'count': rmCacheCount }));
            }
        },

        '~rmconfirm': function(event) {
            var rmCacheCount = this.rmCache.length;
            this.rmCache.length = 0;
            event.reply(dbot.t('quote_cache_cleared', 
                { 'count': rmCacheCount }));
        },

        '~rmdeny': function(event) {
            var rmCache = this.rmCache;
            var rmCacheCount = rmCache.length;
            for(var i=0;i<rmCacheCount;i++) {
                if(!_.has(quotes, rmCache[i].key)) {
                    quotes[rmCache[i].key] = [];
                }
                quotes[rmCache[i].key].push(rmCache[i].quote);
            }
            rmCache.length = 0;

            event.reply(dbot.t('quote_cache_reinstated', 
                { 'count': rmCacheCount }));
        },

        // Retrieve quote from a category in the database.
        '~q': function(event) {
            var name = event.input[1].trim().toLowerCase();
            this.db.read('quote_category', name, function(err, category) {
                if(!err) {
                    var quoteIndex = _.random(0, category.length - 1); 
                    event.reply(key + ': ' + category[quoteIndex]);
                } else if(err instanceof AlreadyExistsError) {
                    event.reply(dbot.t('category_not_found', { 'category': name }));
                }
            });
        },

        // Shows a list of the biggest categories
        '~qstats': function(event) {
            this.db.readAll('quote_category)
            var qSizes = _.chain(quotes)
                .pairs()
                .sortBy(function(category) { return category[1].length })
                .reverse()
                .first(10)
                .value();

            var qString = dbot.t('large_categories');
            for(var i=0;i<qSizes.length;i++) {
                qString += qSizes[i][0] + " (" + qSizes[i][1].length + "), ";
            }

            event.reply(qString.slice(0, -2));
        },
        
        // Search a given category for some text.
        // TODO fix
        '~qsearch': function(event) {
            var haystack = event.input[1].trim().toLowerCase();
            var needle = event.input[2];
            if(_.has(quotes, haystack)) {
                var matches = _.filter(quotes[haystack], function(quote) {
                    return quote.indexOf(needle) != -1;
                }, this);

                if(matches.length == 0) {
                    event.reply(dbot.t('no_results'));
                } else {
                    event.reply(dbot.t('search_results', {
                        'category': haystack, 
                        'needle': needle,
                        'quote': matches[0],
                        'matches': matches.length
                    }));
                }
            } else {
                event.reply(dbot.t('empty_category'));
            }
        },

        '~rmlast': function(event) {
            if(this.rmAllowed === true || _.include(dbot.config.admins, event.user)) {
                var key = event.input[1].trim().toLowerCase();
                if(_.has(quotes, key)) {
                    var quote = quotes[key].pop();
                    if(quotes[key].length == 0) {
                        delete quotes[key];
                    }
                    this.internalAPI.resetRemoveTimer(event, key, quote);

                    event.reply(dbot.t('removed_from', {
                        'quote': quote, 
                        'category': key
                    }));
                } else {
                    event.reply(dbot.t('no_quotes', {'category': q[1]}));
                }
            } else {
                event.reply(dbot.t('rmlast_spam'));
            }
        },

        '~rm': function(event) {
            if(this.rmAllowed == true || _.include(dbot.config.admins, event.user)) {
                var key = event.input[1].trim().toLowerCase();
                var quote = event.input[2];

                this.db.remove('quote_category', key, quote, function(err) {
                    if(!err) {
                        this.internalAPI.resetRemoveTimer(event, key, quote);
                        event.reply(dbot.t('removed_from', {
                            'category': key, 
                            'quote': quote
                        }));
                    } else if(err instanceof NoSuchThingError) {
                        event.reply(dbot.t('category_not_found', { 'category': key }));
                    } else if(err instanceof NoSuchItemError) {
                        event.reply(dbot.t('q_not_exist_under', {
                            'category': key, 
                            'quote': quote
                        }));
                    }
                }.bind(this));
            } else {
                event.reply(dbot.t('rmlast_spam'));
            }
        },

        '~qcount': function(event) {
            var input = event.message.valMatch(/^~qcount ([\d\w\s-]*)/, 2);
            if(input) { // Give quote count for named category
                var key = input[1].trim().toLowerCase();
                this.db.get('quote_category', key, function(err, category) {
                    if(!err) {
                        event.reply(dbot.t('quote_count', {
                            'category': key, 
                            'count': category.length
                        }));
                    } else if(err instanceof AlreadyExistsError) {
                        event.reply(dbot.t('category_not_found', { 'category': name }));
                    }
                }.bind(this));
            } else { // TODO: databankise total quote count
                var totalQuoteCount = _.reduce(quotes, function(memo, category) {
                    return memo + category.length;
                }, 0);
                event.reply(dbot.t('total_quotes', { 'count': totalQuoteCount }));
            }
        },

        '~qadd': function(event) {
            var key = event.input[1].toLowerCase();
            var quote = event.input[2];

            this.db.indexOf('quote_category', key, text, function(err, index) {
                if(index == -1) {
                    this.db.append('quote_category', key, quote, function(err) {
                        this.rmAllowed = true;
                        dbot.api.event.emit('~qadd', {
                            'key': key,
                            'text': text
                        });
                        event.reply(dbot.t('quote_saved', {
                            'category': key, 
                            'count': 0 // TODO: Figure out a way to get the count in the shim
                        }));
                    }.bind(this));
                } else {
                    event.reply(dbot.t('quote_exists'));
                }
            }.bind(this));
        },

        '~rq': function(event) {
            var category = _.keys(quotes)[_.random(0, _.size(quotes) -1)];
            event.reply(category + ': ' + this.internalAPI.interpolatedQuote(event.server, event.channel.name, category));
        },
        
        '~link': function(event) {
            var key = event.input[1].toLowerCase();
            if(_.has(quotes, key)) {
                event.reply(dbot.t('quote_link', {
                    'category': key, 
                    'url': dbot.t('url', {
                        'host': dbot.config.web.webHost, 
                        'port': dbot.config.web.webPort, 
                        'path': 'quotes/' + key
                    })
                }));
            } else {
                event.reply(dbot.t('category_not_found', { 'category': key }));
            }
        },
    };

    commands['~'].regex = [/^~([\d\w\s-]*)/, 2];
    commands['~q'].regex = [/^~q ([\d\w\s-]*)/, 2];
    commands['~qsearch'].regex = [/^~qsearch ([\d\w\s-]+?)[ ]?=[ ]?(.+)$/, 3];
    commands['~rm'].regex = [/^~rm ([\d\w\s-]+?)[ ]?=[ ]?(.+)$/, 3];
    commands['~rmlast'].regex = [/^~rmlast ([\d\w\s-]*)/, 2];
    commands['~qadd'].regex = [/^~qadd ([\d\w\s-]+?)[ ]?=[ ]?(.+)$/, 3];
    commands['~link'].regex = [/^~link ([\d\w\s-]*)/, 2];

    commands['~rmconfirm'].access = 'moderator';
    commands['~rmdeny'].access = 'moderator';

    return commands;
};

exports.fetch = function(dbot) {
    return commands(dbot);
};
