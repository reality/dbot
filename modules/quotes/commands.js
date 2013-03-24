var _ = require('underscore')._,
    databank = require('databank'),
    AlreadyExistsError = databank.AlreadyExistsError,
    NoSuchThingError = databank.NoSuchThingError;

var commands = function(dbot) {
    var quotes = dbot.db.quoteArrs;
    var commands = {

        /*** Quote Addition ***/

        // Add a quote to a category
        '~qadd': function(event) {
            var key = event.input[1].toLowerCase();
            var quote = event.input[2];

            this.db.indexOf('quote_category', key, quote, function(err, index) {
                if(index == null || index == -1) {
                    this.db.append('quote_category', key, quote, function(err, newCount) {
                        this.rmAllowed = true;
                        dbot.api.event.emit('~qadd', {
                            'key': key,
                            'text': quote
                        });
                        event.reply(dbot.t('quote_saved', {
                            'category': key, 
                            'count': newCount
                        }));
                    }.bind(this));
                } else {
                    event.reply(dbot.t('quote_exists'));
                }
            }.bind(this));
        },

        /*** Quote Retrieval ***/

        // Alternative ~q syntax
        '~': function(event) {
            commands['~q'].bind(this)(event);
        },

        // Retrieve quote from a category in the database.
        '~q': function(event) {
            var name = event.input[1].trim().toLowerCase();
            this.db.read('quote_category', name, function(err, category) {
                if(!err) {
                    var quoteIndex = _.random(0, category.length - 1); 
                    event.reply(name + ': ' + category[quoteIndex]);
                } else if(err instanceof NoSuchThingError) {
                    event.reply(dbot.t('category_not_found', { 'category': name }));
                }
            });
        },

        '~rq': function(event) {
            if(_.keys(quotes).length > 0) {
                var category = _.keys(quotes)[_.random(0, _.size(quotes) -1)];
                event.reply(category + ': ' + this.internalAPI.interpolatedQuote(event.server, event.channel.name, category));
            } else {
                event.reply(dbot.t('no_results'));
            }
        },

        /*** Quote Removal ***/

        // Show number of quotes in removal cache
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

        // Confirm removal of quote cache
        '~rmconfirm': function(event) {
            var rmCacheCount = this.rmCache.length;
            this.rmCache.length = 0;
            event.reply(dbot.t('quote_cache_cleared', 
                { 'count': rmCacheCount }));
        },

        // Reinstate all quotes in removal cache
        '~rmdeny': function(event) {
            var rmCache = this.rmCache;
            var rmCacheCount = rmCache.length;
            
            _.each(rmCache, function(quote, index) {
                this.db.append('quote_category', quote.key, quote.quote, function(err, length) {
                    if(err) {
                        // QQ
                    }
                });
            });

            rmCache.length = 0;
            event.reply(dbot.t('quote_cache_reinstated', 
                { 'count': rmCacheCount }));
        },

        // Remove last quote from category
        '~rmlast': function(event) {
            if(this.rmAllowed === true || _.include(dbot.config.admins, event.user)) {
                var key = event.input[1].trim().toLowerCase();

                this.db.slice('quote_category', key, -1, 1, function(err, removed) {
                    if(!err) {
                        this.internalAPI.resetRemoveTimer(event, key, removed);
                        event.reply(dbot.t('removed_from', {
                            'quote': removed, 
                            'category': key
                        }));
                    } else if(err instanceof NoSuchThingError) {
                        event.reply(dbot.t('category_not_found', { 'category': key }));
                    }
                }.bind(this));
            } else {
                event.reply(dbot.t('rmlast_spam'));
            }
        },

        // Remove specific quote from category
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

        /*** Quote Statistics and Searching ***/

        // Shows a list of the biggest categories
        '~qstats': function(event) {
            var quoteSizes = {};
            this.db.scan('quote_category', function(category) {
                // TODO: get name?
                quoteSizes[name] = category.length; 
            }.bind(this), function(err) {
                if(err) {
                    // QQ
                }
            });

            var qSizes = _.chain(quoteSizes)
                .pairs()
                .sortBy(function(category) { return category[1] })
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
        '~qsearch': function(event) {
            var haystack = event.input[1].trim().toLowerCase();
            var needle = event.input[2];

            this.db.read('quote_category', haystack, function(err, category) {
                if(!err) {
                    var matches = _.filter(category, function(quote) {
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
                } else if(err == NoSuchThingError) {
                    event.reply(dbot.t('empty_category'));
                }
            }.bind(this));
        },
       
        // Count quotes in a given category or total quotes overall
        '~qcount': function(event) {
            var input = event.message.valMatch(/^~qcount ([\d\w\s-]*)/, 2);
            if(input) { // Give quote count for named category
                var key = input[1].trim().toLowerCase();
                this.db.read('quote_category', key, function(err, category) {
                    if(!err) {
                        event.reply(dbot.t('quote_count', {
                            'category': key, 
                            'count': category.length
                        }));
                    } else if(err instanceof AlreadyExistsError) {
                        event.reply(dbot.t('category_not_found', { 'category': name }));
                    }
                }.bind(this));
            } else {
                var quoteCount = 0;
                this.db.scan('quote_category', function(category) {
                    quoteCount += category.length; 
                }.bind(this), function(err) {
                    if(!err) {
                        event.reply(dbot.t('total_quotes', { 'count': quoteCount }));
                    }
                }.bind(this));
            }
        },

        // Link to quote web page
        '~link': function(event) {
            var key = event.input[1].toLowerCase();
            this.db.read('quote_category', key, function(err, category) {
                if(!err) {
                    if(_.has(dbot.config, 'web') && _.has(dbot.config.web, 'webHost')
                        event.reply(dbot.t('quote_link', {
                            'category': key, 
                            'url': dbot.t('url', {
                                'host': dbot.config.web.webHost, 
                                'port': dbot.config.web.webPort, 
                                'path': 'quotes/' + encodeURIComponent(key)
                            })
                        }));
                    } else {
                        event.reply(dbot.t('web_not_configured'));
                    }
                } else if(err == NoSuchThingError) {
                    event.reply(dbot.t('category_not_found', { 'category': key }));
                }
            });
        }
    };

    commands['~'].regex = [/^~([\d\w\s-]*)/, 2];
    commands['~q'].regex = [/^~q ([\d\w\s-]*)/, 2];
    commands['~qsearch'].regex = [/^~qsearch ([\d\w\s-]+?)[ ]?=[ ]?(.+)$/, 3];
    commands['~rm'].regex = [/^~rm ([\d\w\s-]+?)[ ]?=[ ]?(.+)$/, 3];
    commands['~rmlast'].regex = [/^~rmlast ([\d\w\s-]*)/, 2];
    commands['~qadd'].regex = [/^~qadd ([\d\w-]+[\d\w\s-]*)[ ]?=[ ]?(.+)$/, 3];
    commands['~link'].regex = [/^~link ([\d\w\s-]*)/, 2];

    commands['~rmconfirm'].access = 'moderator';
    commands['~rmdeny'].access = 'moderator';

    return commands;
};

exports.fetch = function(dbot) {
    return commands(dbot);
};
