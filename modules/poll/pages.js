var _ = require('underscore')._;

var pages = function(dbot) {
    var polls = dbot.db.polls;
    var pages = {
        // Shows the results of a poll
        '/polls/:key': function(req, res) {
            var key = req.params.key.toLowerCase();
            if(_.has(dbot.db.polls, key)) {
                var totalVotes = _.reduce(dbot.db.polls[key].votes, 
                    function(memo, option) {
                        return memo += option;
                    }, 0);
                res.render('polls', { 
                    'name': dbot.config.name, 
                    'description': dbot.db.polls[key].description, 
                    'votees': Object.keys(dbot.db.polls[key].votees), 
                    'options': dbot.db.polls[key].votes, 
                    locals: { 
                        'totalVotes': totalVotes, 
                        'url_regex': RegExp.prototype.url_regex() 
                    } 
                });
            } else {
                res.render('error', { 
                    'name': dbot.config.name, 
                    'message': 'No polls under that key.' 
                });
            }
        },

        // Lists all of the polls
        '/polls': function(req, res) {
            res.render('polllist', { 
                'name': dbot.config.name, 
                'polllist': Object.keys(dbot.db.polls) 
            });
        },
    };
    return pages;
};

exports.fetch = function(dbot) {
    return pages(dbot);
};
