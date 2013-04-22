var _ = require('underscore')._,
    databank = require('databank'),
    uuid = require('node-uuid');

var commands = function(dbot) {
    var commands = {
        /*** Quote Addition ***/

        // Add a quote to a category
        '~qadd': function(event) {
            var key = event.input[1].toLowerCase().trim();
                quote = event.input[2];

            this.api.addQuote(key, quote, event.user, function(newCount) {
                if(newCount) {
                    dbot.api.event.emit('~qadd', [ key, quote ]);
                    event.reply(dbot.t('quote_saved', {
                        'category': key, 
                        'count': newCount
                    }));
                } else {
                    event.reply(dbot.t('quote_exists'));
                }
            });
        },

        /*** Quote Retrieval ***/

        // Alternative ~q syntax
        '~': function(event) {
            commands['~q'].bind(this)(event);
        },

        // Retrieve quote from a category in the database.
        '~q': function(event) {
            var key = event.input[1];
            this.api.getInterpolatedQuote(event.server, event.channel, key, function(quote) {
                if(quote) {
                    event.reply(key + ': ' + quote);
                } else {
                    event.reply(dbot.t('category_not_found', { 'category': key }));
                }
            });
        },

        // Choose a random quote category and a random quote from that
        // TODO: This is quite inefficient, but databank must evolve to do otherwise.
        '~rq': function(event) {
            var categories = []; 
            this.db.scan('quote_category', function(result) {
                if(result) {
                    categories.push(result);
                }
            }, function(err) {
                var cIndex = _.random(0, _.size(categories) -1); 
                var qIndex = _.random(0, categories[cIndex].quotes.length - 1); 
                event.reply(categories[cIndex].name + ': ' + categories[cIndex].quotes[qIndex]);
            });
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
                this.api.addQuote(quote.key, quote.quote, event.user, function(newCount) { });
            });

            rmCache.length = 0;
            event.reply(dbot.t('quote_cache_reinstated', 
                { 'count': rmCacheCount }));
        },

        '~rmlast': function(event) {
            if(this.rmAllowed === true || _.include(dbot.config.admins, event.user)) {
                var key = event.input[1].trim().toLowerCase(),
                    category = false,
                    removedQuote;
                var quoteRemoved = function(err) {
                    this.internalAPI.resetRemoveTimer(event, key, removedQuote);
                    event.reply(dbot.t('removed_from', {
                        'quote': removedQuote, 
                        'category': key
                    }));
                }.bind(this);

                this.db.search('quote_category', { 'name': key }, function(result) {
                    category = result;    
                }, function(err) {
                    if(category) {
                        removedQuote = category.quotes.pop();
                        if(category.quotes.length == 0) {
                            this.db.del('quote_category', category.id, quoteRemoved);
                        } else {
                            this.db.save('quote_category', category.id, category, quoteRemoved);
                        }
                    } else {
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
                    quote = event.input[2],
                    category = false;
                var quoteRemoved = function(err) {
                    this.internalAPI.resetRemoveTimer(event, key, quote);
                    event.reply(dbot.t('removed_from', {
                        'category': key, 
                        'quote': quote
                    }));
                }.bind(this);

                this.db.search('quote_category', { 'name': key }, function(result) {
                    category = result;
                }, function(err) {
                    if(category) {
                        if(category.quotes.indexOf(quote) != -1) {
                            category.quotes = _.without(category.quotes, quote);
                            if(category.quotes.length == 0) {
                                this.db.del('quote_category', category.id, quoteRemoved);
                            } else {
                                this.db.save('quote_category', category.id, category, quoteRemoved);
                            }
                        } else {
                            event.reply(dbot.t('q_not_exist_under', {
                                'category': key, 
                                'quote': quote
                            }));
                        }
                    } else {
                        event.reply(dbot.t('category_not_found', { 'category': key }));
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
                if(category) {
                    quoteSizes[category.name] = category.quotes.length; 
                }
            }.bind(this), function(err) {
                var qSizes = _.chain(quoteSizes)
                    .pairs()
                    .sortBy(function(category) { return category[1] })
                    .reverse()
                    .first(10)
                    .value();

                var qString = dbot.t('large_categories');
                for(var i=0;i<qSizes.length;i++) {
                    qString += qSizes[i][0] + " (" + qSizes[i][1] + "), ";
                }

                event.reply(qString.slice(0, -2));
            });
        },
        
        // Search a given category for some text.
        '~qsearch': function(event) {
            var haystack = event.input[1].trim().toLowerCase(),
                needle = event.input[2],
                category = false;
            
            if(haystack == '*') {
                var matches = [];
                this.db.scan('quote_category', function(category) {
                    if(category) {
                        var theseMatches =_.each(category.quotes, function(quote) {
                            if(quote.indexOf(needle) != -1) {
                                matches.push({ 
                                    'category': category.name, 
                                    'quote': quote 
                                });
                            }
                        });
                    }
                }, function(err) {
                    if(matches.length > 0) {
                        event.reply(dbot.t('search_results', {
                            'category': matches[0].category, 
                            'needle': needle,
                            'quote': matches[0].quote,
                            'matches': matches.length
                        }));
                    } else {
                        event.reply(dbot.t('no_results'));
                    }
                });
            } else {
                this.db.search('quote_category', { 'name': haystack }, function(result) {
                    category = result;
                }, function(err) {
                    if(category) {
                        var matches = _.filter(category.quotes, function(quote) {
                            return quote.indexOf(needle) != -1;
                        });

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
                });
            }
        },
       
        // Count quotes in a given category or total quotes overall
        '~qcount': function(event) {
            var input = event.message.valMatch(/^~qcount ([\d\w\s-]*)/, 2);
            if(input) { // Give quote count for named category
                var key = input[1].trim().toLowerCase(),
                    category = false;

                this.db.search('quote_category', { 'name': key }, function(result) {
                    category = result;
                }, function(err) {
                    if(category) {
                        event.reply(dbot.t('quote_count', {
                            'category': key, 
                            'count': category.quotes.length
                        }));
                    } else {
                        event.reply(dbot.t('category_not_found', { 'category': key }));
                    }
                });
            } else {
                var quoteCount = 0;
                this.db.scan('quote_category', function(category) {
                    if(category) {
                        quoteCount += category.quotes.length; 
                    }
                }, function(err) {
                    event.reply(dbot.t('total_quotes', { 'count': quoteCount }));
                });
            }
        },

        // Rename a quote category
        '~qrename': function(event) {
            var oldName = event.input[1],
                newName = event.input[2],
                oldCategory = false,
                newCategory = false;

            this.db.search('quote_category', { 'name': newName }, function(result) {
                newCategory = result;
            }, function(err) {
                if(!newCategory) {
                    this.db.search('quote_category', { 'name': oldName }, function(result) { 
                        oldCategory = result;
                    }, function(err) {
                        oldCategory.name = newName;
                        this.db.save('quote_category', oldCategory.id, oldCategory, function(err) {
                            event.reply(dbot.t('category_renamed', {
                                'oldName': oldName,
                                'newName': newName
                            }));  
                        });
                    }.bind(this));
                } else {
                    event.reply(dbot.t('newcat_exists', { 'newcat': newName }));
                }
            }.bind(this));
        },

        // Merge a quote category insto another
        '~qmerge': function(event) {
            var primaryName = event.input[1],
                secondName = event.input[2],
                primary = false,
                secondary = false;

            this.db.search('quote_category', { 'name': primaryName }, function(result) { 
                primary = result;
            }, function(err) {
                if(primary) {
                    this.db.search('quote_category', { 'name': secondName }, function(result) { 
                        secondary = result;
                    }, function(err) {
                        if(secondary) {
                            primary.quotes = _.union(primary.quotes, secondary.quotes);
                            this.db.save('quote_category', primary.id, primary, function(err) {
                                this.db.del('quote_category', secondary.id, function(err) {
                                    event.reply(dbot.t('categories_merged', {
                                        'from': secondName, 
                                        'into': primaryName
                                    }));
                                });
                            }.bind(this));
                        } else {
                            event.reply(dbot.t('category_not_found', { 'category': secondName }));
                        }
                    }.bind(this));
                } else {
                    event.reply(dbot.t('category_not_found', { 'category': primaryName }));
                }
            }.bind(this));
        },

        // Link to quote web page
        '~link': function(event) {
            var key = event.input[1].toLowerCase(),
                category = false;

            this.db.search('quote_category', { 'name': key }, function(result) {
                category = result;
            }, function(err) {
                if(category) {
                    if(_.has(dbot.config, 'web') && _.has(dbot.config.web, 'webHost')) {
                        event.reply(dbot.t('quote_link', {
                            'category': key, 
                            'url': dbot.api.web.getUrl('quotes/' + encodeURIComponent(key))
                        }));
                    } else {
                        event.reply(dbot.t('web_not_configured'));
                    }
                } else {
                    event.reply(dbot.t('category_not_found', { 'category': key }));
                }
            });
        }
    };

    commands['~'].regex = [/^~([\d\w\s-]*)/, 2];
    commands['~q'].regex = [/^~q ([\d\w\s-]*)/, 2];
    commands['~qsearch'].regex = [/^~qsearch ([\d\w\s*-]+?)[ ]?=[ ]?(.+)$/, 3];
    commands['~rm'].regex = [/^~rm ([\d\w\s-]+?)[ ]?=[ ]?(.+)$/, 3];
    commands['~rmlast'].regex = [/^~rmlast ([\d\w\s-]*)/, 2];
    commands['~qadd'].regex = [/^~qadd ([\d\w-]+[\d\w\s-]*)[ ]?=[ ]?(.+)$/, 3];
    commands['~qrename'].regex = [/^~qrename ([\d\w\s-]+?)[ ]?=[ ]?(.+)$/, 3];
    commands['~qmerge'].regex = [/^~qmerge ([\d\w\s-]+?)[ ]?=[ ]?(.+)$/, 3];
    commands['~link'].regex = [/^~link ([\d\w\s-]*)/, 2];

    commands['~rmconfirm'].access = 'moderator';
    commands['~rmdeny'].access = 'moderator';
    commands['~qrename'].access = 'moderator';
    commands['~qmerge'].access = 'moderator';

    return commands;
};

exports.fetch = function(dbot) {
    return commands(dbot);
};
