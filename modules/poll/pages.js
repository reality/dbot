var _ = require('underscore')._,
    async = require('async');

var pages = function(dbot) {
    var pages = {
        // Shows the results of a poll
        '/poll/:key': function(req, res) {
            var key = req.params.key.toLowerCase();
            this.db.read('poll', key, function(err, poll) {
                if(!err) {
                console.log(poll);
                    var totalVotes = _.reduce(poll.votes, function(memo, option) {
                        return memo += option;
                    }, 0);

                    var voterNicks = [];
                    async.each(_.keys(poll.votees), function(id, done) {
                        dbot.api.users.getUser(id, function(user) {
                            voterNicks.push(user.primaryNick);
                            done();
                        });
                    }, function() {
                        res.render('polls', { 
                            'name': dbot.config.name, 
                            'description': poll.description, 
                            'votees': voterNicks,
                            'options': poll.votes,
                            'totalVotes': totalVotes, 
                            locals: { 
                                'url_regex': RegExp.prototype.url_regex() 
                            }
                        });

                    });
                } else {
                    res.render('error', { 
                        'name': dbot.config.name, 
                        'message': 'No polls under that key.' 
                    });
                }
            });
       },

        // Lists all of the polls
        '/poll': function(req, res) {
            var pollKeys = [];
            this.db.scan('poll', function(result) {
                if(result) pollKeys.push(result.name);
            }, function(err) {
                console.log(pollKeys);
                res.render('polllist', { 
                    'name': dbot.config.name, 
                    'polllist': pollKeys
                });
            });
        }
    };
    return pages;
};

exports.fetch = function(dbot) {
    return pages(dbot);
};
