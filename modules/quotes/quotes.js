var _ = require('underscore')._;

var quotes = function(dbot) {
    var quotes = dbot.db.quoteArrs,
        addStack = [],
        rmAllowed = true,
        rmCache = dbot.sessionData.rmCache,
        rmTimer;
    dbot.sessionData.rmCache = [];

    // Retrieve a random quote from a given category, interpolating any quote
    // references (~~QUOTE CATEGORY~~) within it
    var interpolatedQuote = function(event, key, quoteTree) {
        if(!_.isUndefined(quoteTree) && quoteTree.indexOf(key) != -1) { 
            return ''; 
        } else if(_.isUndefined(quoteTree)) { 
            quoteTree = [];
        }

        var index = _.random(0, quotes[key].length - 1);
        var quoteString = quotes[key][index];

        // Parse quote interpolations
        var quoteRefs = quoteString.match(/~~([\d\w\s-]*)~~/g);
        var thisRef;

        while(quoteRefs && (thisRef = quoteRefs.shift()) !== undefined) {
            var cleanRef = dbot.cleanNick(thisRef.replace(/^~~/,'').replace(/~~$/,'').trim());
            if(cleanRef === '-nicks-') {
                var randomNick = _.keys(event.channel.nicks)[_.random(0, _.size(event.channel.nicks) -1)];
                quoteString = quoteString.replace("~~" + cleanRef + "~~", randomNick);
                quoteTree.pop();
            } else if(_.has(quotes, cleanRef)) {
                quoteTree.push(key);
                quoteString = quoteString.replace("~~" + cleanRef + "~~", 
                        interpolatedQuote(event, cleanRef, quoteTree.slice()));
                quoteTree.pop();
            }
        }

        return quoteString;
    };

    var resetRemoveTimer = function(event, key, quote) {
        rmAllowed = false;
        dbot.timers.addOnceTimer(5000, function() {
            rmAllowed = true;
        });

        rmCache.push({
            'key': key, 
            'quote': quote
        });
        dbot.timers.clearTimeout(rmTimer);

        if(rmCache.length < dbot.config.quotes.rmLimit) {
            rmTimer = dbot.timers.addOnceTimer(600000, function() {
                rmCache.length = 0; // lol what
            });
        } else {
            _.each(dbot.config.admins, function(admin) {
                dbot.say(event.server, admin, dbot.t('rm_cache_limit'));
            });
        }
    };

    var api = {
        'getQuote': function(event, category) {
            var key = category.trim().toLowerCase();
            var altKey;
            if(key.split(' ').length > 0) {
                altKey = key.replace(/ /g, '_');
            }

            if(key.charAt(0) !== '_') { // lol
                if(_.has(quotes, key)) {
                    return interpolatedQuote(event, key);
                } else if(_.has(quotes, altKey)) {
                    return interpolatedQuote(event, altKey);
                } else {
                    return false;
                }
            } 
        }
    };

    var commands = {
        // Alternative syntax to ~q
        '~': function(event) {
            commands['~q'](event);
        },

        '~rmstatus': function(event) {
            var rmCacheCount = rmCache.length;
            if(rmCacheCount < dbot.config.quotes.rmLimit) {
                event.reply(dbot.t('quote_cache_auto_remove', 
                    { 'count': rmCacheCount }));
            } else {
                event.reply(dbot.t('quote_cache_manual_remove', 
                    { 'count': rmCacheCount }));
            }
        },

        '~rmconfirm': function(event) {
            var rmCacheCount = rmCache.length;
            rmCache.length = 0;
            event.reply(dbot.t('quote_cache_cleared', 
                { 'count': rmCacheCount }));
        },

        '~rmdeny': function(event) {
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
            var key = event.input[1].trim().toLowerCase();
            var quote = api.getQuote(event, event.input[1]);
            if(quote) {
                event.reply(key + ': ' + quote);
            } else {
                event.reply(dbot.t('category_not_found', {'category': key}));
            }
        },

        // Shows a list of the biggest categories
        '~qstats': function(event) {
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
        '~qsearch': function(event) {
            var haystack = event.input[1].trim().toLowerCase();
            var needle = event.input[2];
            if(_.has(quotes, haystack)) {
                var matches = _.filter(quotes[haystack], function(quote) {
                    return _.indexOf(quote, needle) != -1;
                }, this);

                if(matches.length == 0) {
                    event.reply(dbot.t('no_results'));
                } else {
                    event.reply(dbot.t('search_results', {
                        'category': haystack, 
                        'needle': needle,
                        'quote': matches.random(), 
                        'matches': matches.length
                    }));
                }
            } else {
                event.reply(dbot.t('empty_category'));
            }
        },

        '~rmlast': function(event) {
            if(rmAllowed == true || _.include(dbot.config.admins, event.user)) {
                var key = event.input[1].trim().toLowerCase();
                if(_.has(quotes, key)) {
                    var quote = quotes[key].pop();
                    if(quotes[key].length === 0) {
                        delete quotes[key];
                    }
                    resetRemoveTimer(event, key, quote);

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
            if(rmAllowed == true || _.include(dbot.config.admins, event.user)) {
                var key = event.input[1].trim().toLowerCase();
                var quote = event.input[2];

                if(_.has(quotes, key)) {
                    var category = quotes[key];
                    var index = category.indexOf(quote);
                    if(index !== -1) {
                        category.splice(index, 1);
                        if(category.length === 0) {
                            delete quotes[key];
                        }
                        resetRemoveTimer(event, key, quote);

                        event.reply(dbot.t('removed_from', {'category': key, 'quote': quote}));
                    } else {
                        event.reply(dbot.t('q_not_exist_under', {'category': key, 'quote': quote}));
                    }
                } else {
                    event.reply(dbot.t('category_not_found', {'category': key}));
                }
            } else {
                event.reply(dbot.t('rmlast_spam'));
            }
        },

        '~qcount': function(event) {
            var input = event.message.valMatch(/^~qcount ([\d\w\s-]*)/, 2);
            if(input) { // Give quote count for named category
                var key = input[1].trim().toLowerCase();
                if(_.has(quotes, key)) {
                    event.reply(dbot.t('quote_count', {
                        'category': key, 
                        'count': quotes[key].length
                    }));
                } else {
                    event.reply(dbot.t('no_quotes', { 'category': key }));
                }
            } else { // Give total quote count
                var totalQuoteCount = _.reduce(quotes, function(memo, category) {
                    return memo + category.length;
                }, 0);
                event.reply(dbot.t('total_quotes', { 'count': totalQuoteCount }));
            }
        },

        '~qadd': function(event) {
            var key = event.input[1].toLowerCase();
            var text = event.input[2];
            if(!_.isArray(quotes[key])) {
                quotes[key] = [];
            } 

            if(_.include(quotes[key], text)) {
                event.reply(dbot.t('quote_exists'));
            } else {
                quotes[key].push(text);
                rmAllowed = true;
                event.reply(dbot.t('quote_saved', {
                    'category': key, 
                    'count': quotes[key].length
                }));

                // TODO hook
                if(_.has(dbot.api, 'dent')) {
                    dbot.api.dent.post(key + ': ' + text);
                }
            }
        },

        '~rq': function(event) {
            var category = _.keys(quotes)[_.random(0, _.size(quotes) -1)];
            event.reply(category + ': ' + interpolatedQuote(event, category));
        },
        
        '~link': function(event) {
            var key = event.params[1].trim().toLowerCase();
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

    commands['~rmconfirm'].access = 'moderator';
    commands['~rmdeny'].access = 'moderator';

    var pages = {
        // Lists quotes in a category
        '/quotes/:key': function(req, res) {
            var key = req.params.key.toLowerCase();
            if(_.has(dbot.db.quoteArrs, key)) {
                res.render('quotes', { 'name': dbot.config.name, 'quotes': dbot.db.quoteArrs[key], locals: { 'url_regex': RegExp.prototype.url_regex() } });
            } else {
                res.render('error', { 'name': dbot.config.name, 'message': 'No quotes under that key.' });
            }
        },

        // Show quote list.
        '/quotes': function(req, res) {
            res.render('quotelist', { 'name': dbot.config.name, 'quotelist': Object.keys(dbot.db.quoteArrs) });
        },

        // Load random quote category page
        '/rq': function(req, res) {
            var rCategory = Object.keys(dbot.db.quoteArrs).random();
            res.render('quotes', { 'name': dbot.config.name, 'quotes': dbot.db.quoteArrs[rCategory], locals: { 'url_regex': RegExp.prototype.url_regex() } });
        },
    };

    return {
        'name': 'quotes',
        'ignorable': true,
        'commands': commands,
        'pages': pages,
        'api': api,

        'listener': function(event) {
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
                var userQuote = api.getQuote(event, event.user)
                if(userQuote) {
                    event.reply(event.user + ': ' + api.getQuote(event, event.user));
                }
            }
        },
        'on': ['PRIVMSG', 'JOIN']
    };
};

exports.fetch = function(dbot) {
    return quotes(dbot);
};
