var quotes = function(dbot) {
    var quotes = dbot.db.quoteArrs;
    
    var commands = {
        '~q': function(data, params) { 
            var q = data.message.valMatch(/^~q ([\d\w\s]*)/, 2)
            if(q) {
                key = q[1].trim().toLowerCase();
                if(quotes.hasOwnProperty(key)) {
                    dbot.say(data.channel, key + ': ' + quotes[key].random());
                } else {
                    dbot.say(data.channel, 'No quotes under ' + key);
                }
            }
        },

        '~qcount': function(data, params) {
            var q = data.message.valMatch(/^~qcount ([\d\w\s]*)/, 2);
            if(q) {
                key = key[1].trim().toLowerCase();
                if(quotes.hasOwnProperty(key)) {
                    dbot.say(data.channel, key + ' has ' + quotes[key].length + ' quotes.');
                } else {
                    dbot.say(data.channel, 'No quotes under ' + key);
                }
            }
        },

        '~qadd': function(data, params) {
            var q = data.message.valMatch(/^~qadd ([\d\w\s]*)=(.+)$/, 3);
            if(q) {
                q[1] = q[1].toLowerCase();
                if(!Object.isArray(quotes[q[1]])) {
                    quotes[q[1]] = [];
                }
                quotes[q[1]].push(q[2]);
                dbot.say(data.channel, 'Quote saved in \'' + q[1] + '\' (' + quotes[q[1]].length + ')');
            }
        },

        '~qset': function(data, params) {
            var q = data.message.valMatch(/^~qset ([\d\w\s]*)=(.+)$/, 3);
            if(q) {
                q[1] = q[1].toLowerCase();
                if(!quotes.hasOwnProperty(q[1]) || (quotes.hasOwnProperty(q[1]) && 
                        quotes[q[1]].length == 1)) {
                    quotes[q[1]] = [q[2]];
                    dbot.say(data.channel, 'Quote saved as ' + q[1]);
                } else {
                    dbot.say(data.channel, 'No replacing arrays, you whore.');
                }
            }
        },

        '~rq': function(data, params) {
            var rQuote = Object.keys(quotes).random();
            dbot.say(data.channel, rQuote + ': ' + quotes[rQuote].random());
        },
        
        '~reality': function(data, params) {
            dbot.say(data.channel, dbot.db.realiPuns.random());
        },

        '~d': function(data, params) {
            dbot.say(data.channel,  data.user + ': ' + dbot.db.quoteArrs['depressionbot'].random());
        },

    };

    return {
        'onLoad': function() {
            return commands;
        }
    };
};

exports.fetch = function(dbot) {
    return quotes(dbot);
};
