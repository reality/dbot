var _ = require('underscore')._;

var pages = function(dbot) {
    return {
        '/imgur/random': function(req, res) {
            res.render('imgurr', {
            });
        }
    };
};

exports.fetch = function(dbot) {
    return pages(dbot);
};
