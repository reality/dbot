var _ = require('underscore')._;
var pages = function(dbot) {
    return {
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
        }
    }
};

exports.fetch = function(dbot) {
    return pages(dbot);
};
