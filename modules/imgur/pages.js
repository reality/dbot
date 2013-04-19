var _ = require('underscore')._;

var pages = function(dbot) {
    return {
        '/imgur/random': function(req, res) {
            var hs = dbot.db.quoteArrs[dbot.config.imgur.highscore];
            hs = hs[hs.length-1];
            res.render('imgurr', {"highscore" : hs });
        },

        '/imgur/stats': function(req, res) {
            res.render('imgurstats', {
                'name': dbot.config.name,
                'totalHttpRequests': this.db.totalHttpRequests,
                'totalApiRequests': this.db.totalApiRequests,
                'totalImages': this.db.totalImages
            });
        }
    };
};

exports.fetch = function(dbot) {
    return pages(dbot);
};
