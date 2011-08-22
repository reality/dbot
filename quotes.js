var quotes = function(quotes) {
    var qArrs = quotes;

    return {
        get: function(key) { 
            if(quotes.hasOwnProperty(key)) {
                return key + ': ' + qArrs[key].random();
            } else {
                return 'No quotes under ' + key;
            }
        },

        count: function(key) {
            if(quotes.hasOwnProperty(key)) {
                return key + ' has ' + quotes[key].length + ' quotes.';
            } else {
                return 'No quotes under ' + key;
            }
        },

        add: function(key) {
            if(!Object.isArray(quotes[key[1]])) {
                quotes[key[1]] = [];
            }
            quotes[key[1]].push(key[2]);
            return 'Quote saved in \'' + key[1] + '\' (' + quotes[key[1]].length + ')';
        },

        set: function(key) {
            if(!quotes.hasOwnProperty(key[1]) || (quotes.hasOwnProperty(key[1]) && quotes[key[1]].length == 1)) {
                quotes[key[1]] = [key[2]];
                return 'Quote saved as ' + key[1];
            } else {
                return 'No replacing arrays, you whore.';
            }
        },

        random: function() {
            var rQuote = Object.keys(quotes).random();
            return rQuote + ': ' + quotes[rQuote].random();
        }
    };
};

exports.fetch = function() {
    return quotes;
};
