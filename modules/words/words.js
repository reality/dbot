var Wordnik = require('wordnik');

var words = function(dbot) {
    this.commands = {
        '~define': function(event) {
            var query = event.params[1];
            this.wn.definitions(query, function(err, defs) {
                if(!err && defs[0]) {
                    event.reply(query + ': ' + defs[0].text);
                } else {
                    event.reply('No definitions found for ' + query);
                }
            });
        }
    };

    this.onLoad = function() {
        this.wn = new Wordnik({
            'api_key': this.config.api_key
        });
    }.bind(this);
};

exports.fetch = function(dbot) {
    return new words(dbot);
};
