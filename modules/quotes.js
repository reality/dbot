var quotes = function(dbot) {
    var name = 'quotes';
    var quotes = dbot.db.quoteArrs;
    var addStack = [];
    var rmAllowed = true;

    // Retrieve a random quote from a given category, interpolating any quote
    // references (~~QUOTE CATEGORY~~) within it
    var interpolatedQuote = function(key, quoteTree) {
        if(quoteTree !== undefined && quoteTree.indexOf(key) != -1) { 
            return ''; 
        } else if(quoteTree === undefined) { 
            quoteTree = [];
        }

        var quoteString = quotes[key].random();

        // Parse quote interpolations
        var quoteRefs = quoteString.match(/~~([\d\w\s-]*)~~/g);
        var thisRef;

        while(quoteRefs && (thisRef = quoteRefs.shift()) !== undefined) {
            var cleanRef = dbot.cleanNick(thisRef.replace(/^~~/,'').replace(/~~$/,'').trim());
            if (quotes.hasOwnProperty(cleanRef)) {
                quoteTree.push(key);
                quoteString = quoteString.replace("~~" + cleanRef + "~~", 
                        interpolatedQuote(cleanRef, quoteTree.slice()));
                quoteTree.pop();
            }
        }

        return quoteString;
    };

    var commands = {
        // Alternative syntax to ~q
        '~': function(event) {
            commands['~q'](event);
        },

        // Retrieve quote from a category in the database.
        '~q': function(event) { 
            var key = event.input[1].trim().toLowerCase();
            var altKey;
            if(key.split(' ').length > 0) {
                altKey = key.replace(/ /g, '_');
            }

            if(key.charAt(0) !== '_') { // lol
                if(quotes.hasOwnProperty(key)) {
                    event.reply(key + ': ' + interpolatedQuote(key));
                } else if(quotes.hasOwnProperty(altKey)) {
                    event.reply(altKey + ': ' + interpolatedQuote(altKey));
                } else {
                    event.reply(dbot.t('category_not_found', {'category': key}));
                }
            }
        },

        // Shows a list of the biggest categories
        '~qstats': function(event) {
            var qSizes = Object.prototype.sort(quotes, function(key, obj) { return obj[key].length });
            qSizes = qSizes.slice(qSizes.length - 10).reverse();

            var qString = dbot.t('large_categories');
            for(var i=0;i<qSizes.length;i++) {
                qString += qSizes[i][0] + " (" + qSizes[i][1] + "), ";
            }

            event.reply(qString.slice(0, -2));
        },
        
        // Search a given category for some text.
        '~qsearch': function(event) {
            var haystack = event.input[1].trim().toLowerCase();
            var needle = event.input[2];
            if(quotes.hasOwnProperty(haystack)) {
                var matches = [];
                quotes[haystack].each(function(quote) {
                    if(quote.indexOf(needle) != -1) {
                        matches.push(quote);
                    }
                }.bind(this));

                if(matches.length == 0) {
                    event.reply(dbot.t('no_results'));
                } else {
                    event.reply(dbot.t('search_results', {'category': haystack, 'needle': needle,
                        'quote': matches.random(), 'matches': matches.length}));
                }
            } else {
                event.reply(dbot.t('empty_category'));
            }
        },

        '~rmlast': function(event) {
            if(rmAllowed == true || dbot.admin.include(event.user)) {
                var key = event.input[1].trim().toLowerCase();
                if(quotes.hasOwnProperty(key)) {
                    if(!dbot.db.locks.include(key) || dbot.admin.include(event.user)) {
                        var quote = quotes[key].pop();
                        if(quotes[key].length === 0) {
                            delete quotes[key];
                        }
                        rmAllowed = false;
                        event.reply(dbot.t('removed_from', {'quote': quote, 'category': key}));
                    } else {
                        event.reply(dbot.t('locked_category', {'category': q[1]}));
                    }
                } else {
                    event.reply(dbot.t('no_quotes', {'category': q[1]}));
                }
            } else {
                event.reply(dbot.t('rmlast_spam'));
            }
        },

        /*'~rm': function(data, params) {
            if(rmAllowed == true || dbot.admin.include(data.user)) {
                var q = data.message.valMatch(/^~rm ([\d\w\s-]*) (.+)$/, 3);
                if(q) {
                    if(quotes.hasOwnProperty(q[1])) {
                        if(!dbot.db.locks.include(q[1])) {
                            var index = quotes[q[1]].indexOf(q[2]);
                            if(index != -1) {
                                quotes[q[1]].splice(index, 1);
                                if(quotes[q[1]].length === 0) {
                                    delete quotes[q[1]];
                                }
                                rmAllowed = false;
                                dbot.say(data.channel, dbot.t('removed_from', {'category': q[1], 'quote': q[2]}));
                            } else {
                                dbot.say(data.channel, dbot.t('q_not_exist_under', {'category': q[1], 'quote': q[2]}));
                            }
                        } else {
                            dbot.say(data.channel, dbot.t('locked_category', {'category': q[1]}));
                        }
                    } else {
                        dbot.say(data.channel, dbot.t('no_quotes', {'category': q[1]}));
                    }
                } else {
                    dbot.say(data.channel, dbot.t('syntax_error'));
                }
            } else {
                dbot.say(data.channel, dbot.t('rmlast_spam'));
            }
        },*/

        '~qcount': function(event) {
            var input = event.message.valMatch(/^~qcount ([\d\w\s-]*)/, 2);
            if(input) { // Give quote count for named category
                var key = input[1].trim().toLowerCase();
                if(quotes.hasOwnProperty(key)) {
                    event.reply(dbot.t('quote_count', {'category': key, 'count': quotes[key].length}));
                } else {
                    event.reply(dbot.t('no_quotes', {'category': key}));
                }
            } else { // Give total quote count
                var totalQuoteCount = 0;
                for(var category in quotes) {
                    totalQuoteCount += category.length;
                }
                event.reply(dbot.t('total_quotes', {'count': totalQuoteCount}));
            }
        },

        '~qadd': function(event) {
            var key = event.input[1].toLowerCase();
            var text = event.input[2];
            if(!Object.isArray(quotes[key])) {
                quotes[key] = [];
            } 

            if(quotes[key].include(text)) {
                event.reply(dbot.t('quote_exists'));
            } else {
                quotes[key].push(text);
                rmAllowed = true;
                event.reply(dbot.t('quote_saved', {'category': key, 'count': quotes[key].length}));
            }
        },

        '~rq': function(event) {
            var rQuote = Object.keys(quotes).random();
            event.reply(rQuote + ': ' + interpolatedQuote(rQuote));
        },
        
        '~link': function(event) {
            var key = event.params[1].trim().toLowerCase();
            if(quotes.hasOwnProperty(key)) {
                event.reply(dbot.t('quote_link', {'category': key}) + ' - http://nc.no.de:443/quotes/' + key);
            } else {
                event.reply(dbot.t('category_not_found'));
            }
        },

        '~qprune': function(event) {
            var pruned = []
            for(key in quotes) {
                if(quotes.hasOwnProperty(key)) {
                    if(quotes[key].length == 0) {
                        delete quotes[key];
                        pruned.push(key);
                    }
                }
            }
            if(pruned.length > 0) {
                event.reply(dbot.t('prune', {'categories': pruned.join(", ")}));
            } else {
                event.reply(dbot.t('no_prune'));
            }
        }
    };

    commands['~'].regex = [/^~([\d\w\s-]*)/, 2];
    commands['~q'].regex = [/^~q ([\d\w\s-]*)/, 2];
    commands['~qsearch'].regex = [/^~qsearch ([\d\w\s-]+?)[ ]?=[ ]?(.+)$/, 3];
    commands['~rmlast'].regex = [/^~rmlast ([\d\w\s-]*)/, 2];
    commands['~qadd'].regex = [/^~qadd ([\d\w\s-]+?)[ ]?=[ ]?(.+)$/, 3];

    return {
        'name': 'quotes',
        'ignorable': true,
        'commands': commands,

        'onLoad': function() {
            dbot.timers.addTimer(1000 * 60 * 3, function() {
                rmAllowed = true;
            });
        },

        'listener': function(event) {
            if((dbot.db.ignores.hasOwnProperty(event) && 
                        dbot.db.ignores[event.user].include(name)) == false) {
                if(event.user == 'reality') {
                    var once = event.message.valMatch(/^I ([\d\w\s,'-]* once)/, 2);
                } else {
                    var once = event.message.valMatch(/^reality ([\d\w\s,'-]* once)/, 2);
                }

                if(once) {
                    if((dbot.db.bans.hasOwnProperty('~qadd') &&
                    dbot.db.bans['~qadd'].include(event.user)) ||
                    dbot.db.bans['*'].include(event.user)) {
                        event.reply(dbot.t('command_ban', {'user': event.user})); 
                    } else {
                        if(!dbot.db.quoteArrs.hasOwnProperty('realityonce')) {
                            dbot.db.quoteArrs['realityonce'] = [];
                        }
                        dbot.db.quoteArrs['realityonce'].push('reality ' + once[1] + '.');
                        addStack.push('realityonce');
                        rmAllowed = true;
                        event.reply('\'reality ' + once[1] + '.\' saved.');
                    }
                }
            }
        },

        'on': 'PRIVMSG'
    };
};

exports.fetch = function(dbot) {
    return quotes(dbot);
};
