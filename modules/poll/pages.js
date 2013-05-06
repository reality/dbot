var _ = require('underscore')._;

var pages = function(dbot) {
    var pages = {
        // Shows the results of a poll
        '/poll/:key': function(req, res) {
            var key = req.params.key.toLowerCase();
            this.db.read('poll', key, function(err, poll) {
                if(!err) {
                    var totalVotes = _.reduce(poll.votes, function(memo, option) {
                        return memo += option;
                    }, 0);

                    var voterNicks = [];
                    /* TODO: Fix stupid fucking async issue bullshit
                    var voterNicks = _.map(poll.votees, function(vote, id) {
                        dbot.api.users.getUser(id, function(user) {
                            return user.primaryNick;
                        });
                    });*/

                    process.nextTick(function() {
                        console.log(voterNicks);
                        res.render('polls', { 
                            'name': dbot.config.name, 
                            'description': poll.description, 
                            'votees': voterNicks,
                            'options': poll.votes,
                            locals: { 
                                'totalVotes': totalVotes, 
                                'url_regex': RegExp.prototype.url_regex() 
                            }
                        });
                    });
                } else {
                    console.log(err);
                    console.log("the thing the thing");
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
