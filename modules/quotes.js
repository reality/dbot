var quotes = function(dbot) {
    var name = 'quotes';
    var quotes = dbot.db.quoteArrs;
    var addStack = [];
    var rmAllowed = true;

    // Retrieve a random quote from a given category, interpolating any quote references (~~QUOTE CATEGORY~~) within it
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

        // Parse quote parameters
        /*
        var paramRefs = quoteString.match(/~~\$([1-9])~~/g);
        var thisParam;

        while(paramRefs && (thisParam = paramRefs.shift()) !== undefined) {
            thisParam = thisParam[1];
            console.log(thisParam);
            if(thisParam < params.length) {
                quoteString = quoteString.replace("~~$" + thisParam + "~~", params[thisParam]);
            }
        }
        */

        return quoteString;
    };

    var commands = {
        '~q': function(data, params) { 
            var q = data.message.valMatch(/^~q ([\d\w\s-]*)/, 2);
            if(q) {
                q[1] = q[1].trim();
                key = q[1].toLowerCase();
                if(quotes.hasOwnProperty(key)) {
                    dbot.say(data.channel, q[1] + ': ' + interpolatedQuote(key));
                } else {
                    dbot.say(data.channel, dbot.t('category_not_found', {'category': q[1]}));
                }
            }
        },

        // shows the biggest categories
        '~qstats': function(data, params) {
            var qSizes = []; 
            for(var cat in quotes) {
                if(quotes[cat].length != 0) {
                    qSizes.push([cat, quotes[cat].length]);
                }
            }

            qSizes = qSizes.sort(function(a, b) { return a[1] - b[1]; });
            qSizes = qSizes.slice(qSizes.length - 10).reverse();

            var qString = dbot.t('large_categories');

            for(var i=0;i<qSizes.length;i++) {
                qString += qSizes[i][0] + " (" + qSizes[i][1] + "), ";
            }

            dbot.say(data.channel, qString.slice(0, -2));
        },
        
        '~qsearch': function(data, params) {
            if(params[2] === undefined) {
                dbot.say(data.channel, dbot.t('syntax_error'));
            } else {
                params[1].trim();
                key = params[1].toLowerCase();
                if(!quotes.hasOwnProperty(key)) {
                    dbot.say(data.channel, dbot.t('empty_category'));
                } else {
                    var matches = [];
                    
                    quotes[key].each(function(quote) {
                        if(quote.indexOf(params[2]) != -1) {
                            matches.push(quote);
                        }
                    }.bind(this));

                    if(matches.length == 0) {
                        dbot.say(data.channel, dbot.t('no_results'));
                    } else {
                        dbot.say(data.channel, params[1] + ' (' + params[2] + '): ' + matches.random() + ' [' + matches.length + ' results]');
                    }
                }
            }
        },

        '~rmlast': function(data, params) {
            if(rmAllowed == true || dbot.admin.include(data.user)) {
                var q = data.message.valMatch(/^~rmlast ([\d\w\s-]*)/, 2);
                if(q) {
                    q[1] = q[1].trim()
                    key = q[1].toLowerCase();
                    if(quotes.hasOwnProperty(q[1])) {
                        if(!dbot.db.locks.include(q[1]) || dbot.admin.include(data.user)) {
                            var quote = quotes[key].pop();
                            if(quotes[key].length === 0) {
                                delete quotes[key];
                            }
                            rmAllowed = false;
                            dbot.say(data.channel, '\'' + quote + '\'' + 
                                    dbot.t('removed_from') + q[1]);
                        } else {
                            dbot.say(data.channel, dbot.t('locked_category', {'category': q[1]}));
                        }
                    } else {
                        dbot.say(data.channel, dbot.t('no_quotes', {'category': q[1]}));
                    }
                } else {
                    var last = addStack.pop();
                    if(last) {
                        if(!dbot.db.locks.include(last)) {
                            quotes[last].pop();
                            rmAllowed = false;
                            dbot.say(data.channel, dbot.t('last_removed', {'category': last}));
                        } else {
                            dbot.say(data.channel, dbot.t('locked_category', {'category': last}));
                        }
                    } else {
                        dbot.say(data.channel, dbot.t('no_recent_adds'));
                    }
                }
            } else {
                dbot.say(data.channel, dbot.t('rmlast_spam'));
            }
        },

        '~rm': function(data, params) {
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
        },

        '~qcount': function(data, params) {
            var q = data.message.valMatch(/^~qcount ([\d\w\s-]*)/, 2);
            if(q) {
                q[1] = q[1].trim();
                key = q[1].toLowerCase();
                if(quotes.hasOwnProperty(key)) {
                    dbot.say(data.channel, dbot.t('quote_count', {'category': q[1], 'count': quotes[key].length}));
                } else {
                    dbot.say(data.channel, dbot.t('no_quotes', {'category': q[1]}));
                }
            } else { // Give total quote count
                var totalQuoteCount = 0;
                for(var category in quotes) {
                    totalQuoteCount += category.length;
                }
                dbot.say(data.channel, dbot.t('total_quotes', {'count': totalQuoteCount}));
            }
        },

        '~qadd': function(data, params) {
            var q = data.message.valMatch(/^~qadd ([\d\w\s-]+?)[ ]?=[ ]?(.+)$/, 3);
            if(q) {
                key = q[1].toLowerCase();
                if(!Object.isArray(quotes[key])) {
                    quotes[key] = [];
                } else {
                    if (quotes[key].include(q[2])) {
                        dbot.say(data.channel, dbot.t('quote_exists'));
                        return;
                    }
                }
                quotes[key].push(q[2]);
                addStack.push(q[1]);
                rmAllowed = true;
                dbot.say(data.channel, dbot.t('quote_saved', {'category': q[1], 'count': quotes[key].length}));
            } else {
                dbot.say(data.channel, dbot.t('syntax_error'));
            }
        },

        '~qset': function(data, params) {
            var q = data.message.valMatch(/^~qset ([\d\w\s-]*)=(.+)$/, 3);
            if(q) {
                q[1] = q[1].trim();
                key = q[1].toLowerCase();
                if(!quotes.hasOwnProperty(key) || (quotes.hasOwnProperty(key) && 
                        quotes[key].length == 1)) {
                    quotes[key] = [q[2]];
                    dbot.say(data.channel, dbot.t('quote_saved', {'category': q[1], 'count': 1}));
                } else {
                    dbot.say(data.channel, dbot.t('quote_replace'));
                }
            }
        },

        '~rq': function(data, params) {
            var rQuote = Object.keys(quotes).random();
            dbot.say(data.channel, rQuote + ': ' + interpolatedQuote(rQuote));
        },

        '~d': function(data, params) {
            dbot.say(data.channel,  data.user + ': ' + interpolatedQuote(dbot.name));
        },
        
        '~link': function(data, params) {
            if(params[1] === undefined || !quotes.hasOwnProperty(params[1].toLowerCase())) {
                dbot.say(data.channel, dbot.t('syntax_error'));
            } else {
                dbot.say(data.channel, dbot.t('quote_link', {'category': params[1]}) + 
                        ' - http://nc.no.de:443/quotes/' + params[1]);
            }
        },

        '~qprune': function(data) {
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
                dbot.say(data.channel, dbot.t('prune', {'categories': pruned.join(", ")}));
            } else {
                dbot.say(data.channel, dbot.t('no_prune'));
            }
        }
    };

    return {
        'onLoad': function() {
            dbot.timers.addTimer(1000 * 60 * 3, function() {
                rmAllowed = true;
            });
            return commands;
        },

        // For automatic quote retrieval
        'listener': function(data, params) {
            if((dbot.db.ignores.hasOwnProperty(data.user) && 
                        dbot.db.ignores[data.user].include(name)) == false) {
                if(data.user == 'reality') {
                    var once = data.message.valMatch(/^I ([\d\w\s,'-]* once)/, 2);
                } else {
                    var once = data.message.valMatch(/^reality ([\d\w\s,'-]* once)/, 2);
                }

                if(once) {
                    if((dbot.db.bans.hasOwnProperty('~qadd') &&
                    dbot.db.bans['~qadd'].include(data.user)) ||
                    dbot.db.bans['*'].include(data.user)) {
                        dbot.say(data.channel, dbot.t('command_ban', {'user': data.user})); 
                    } else {
                        if(!dbot.db.quoteArrs.hasOwnProperty('realityonce')) {
                            dbot.db.quoteArrs['realityonce'] = [];
                        }
                        dbot.db.quoteArrs['realityonce'].push('reality ' + once[1] + '.');
                        addStack.push('realityonce');
                        rmAllowed = true;
                        dbot.instance.say(data.channel, '\'reality ' + once[1] + '.\' saved.');
                    }
                }
            }
        },

        'on': 'PRIVMSG',

        'name': name,

        'ignorable': true
    };
};

exports.fetch = function(dbot) {
    return quotes(dbot);
};
