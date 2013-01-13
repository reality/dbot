var _ = require('underscore')._;

var poll = function(dbot) {
    var polls = dbot.db.polls;
    var commands = {
        '~newpoll': function(event) {
            var name = event.input[1],
                options = event.input[2].split(','),
                description = event.input[3];
            
            if(_.has(polls, name)) {
                event.reply(dbot.t('poll_exists', { 'name': name }));
            } else {
                polls[name] = {
                    'name': name,
                    'description': description,
                    'owner': event.user,
                    'votes': {},
                    'votees': {}
                };
                for(var i=0;i<options.length;i++) {
                    polls[name]['votes'][options[i]] = 0;
                }
                event.reply(dbot.t('poll_created', {
                    'name': name, 
                    'description': description, 
                    'url': dbot.t('url', {
                        'host': dbot.config.web.webHost,
                        'port': dbot.config.web.webPort, 
                        'path': 'polls/' + name
                    })
                })); 
            }
        },

        '~addoption': function(event) {
            var name = event.input[1],
                option = event.input[2];
            
            if(_.has(polls, name)) {
                if(polls[name].owner === event.user) {
                    if(!_.has(polls[name].votes, name)) {
                        polls[name]['votes'][option] = 0;
                        event.reply(dbot.t('option_added', {
                            'user': event.user, 
                            'name': name, 
                            'option': option
                        }));
                    } else {
                        event.reply(dbot.t('option_exists', {
                            'option': option,
                            'name': name, 
                            'user': event.user
                        }));
                    }
                } else {
                    event.reply(dbot.t('not_poll_owner', {
                        'user': event.user,
                        'name': name
                    }));
                }
            } else {
                event.reply(dbot.t('poll_unexistent', {'name': name}));
            }
        },

        '~rmoption': function(event) {
            var name = event.input[1],
                option = event.input[2];
            
            if(_.has(polls, name)) {
                if(polls[name].owner === event.user) {
                    if(_.has(polls[name].votes, option)) {
                        delete polls[name]['votes'][option];
                        event.reply(dbot.t('option_removed', {
                            'user': event.user,
                            'name': name, 
                            'option': option
                        }));
                    } else {
                        event.reply(dbot.t('invalid_vote', { 'vote': option }));
                    }
                } else {
                    event.reply(dbot.t('not_poll_owner', { 'name': name }));
                }
            } else {
                event.reply(dbot.t('poll_unexistent', { 'name': name }));
            }
        },

        '~vote': function(event) {
            var name = event.input[1],
                vote = event.input[2];

            if(_.has(polls, name)) {
                    if(_.has(polls[name].votes, vote)) {
                        if(_.has(polls[name].votees, event.user)) {
                            var oldVote = polls[name].votees[event.user];
                            polls[name].votes[oldVote]--;
                            polls[name].votes[vote]++;
                            polls[name].votees[event.user] = vote;

                            event.reply(dbot.t('changed_vote', {
                                'vote': vote, 
                                'poll': name,
                                'count': polls[name].votes[vote], 
                                'user': event.user
                            }));
                        } else {
                            polls[name].votes[vote]++;
                            polls[name].votees[event.user] = vote;
                            event.reply(dbot.t('voted', {
                                'vote': vote, 
                                'poll': name,
                                'count': polls[name].votes[vote], 
                                'user': event.user
                            }));
                        }
                    } else {
                        event.reply(dbot.t('invalid_vote', { 'vote': vote }));
                    }
            } else {
                event.reply(dbot.t('poll_unexistent', { 'name': name }));
            }
        },

        '~pdesc': function(event) {
            var name = event.input[1];

            if(_.has(polls, name)) {
                event.reply(dbot.t('poll_describe', {
                    'name': name, 
                    'description': polls[name].description,
                    'url': dbot.t('url', {
                        'host': dbot.config.web.webHost, 
                        'port': dbot.config.web.webPort, 
                        'path': 'polls/' + name
                    })
                }));
            } else {
                event.reply(dbot.t('poll_unexistent', { 'name': name }));
            }
        },
        
        '~count': function(event) {
            var name = event.input[1];
            
            if(_.has(polls, name)) {
                var order;
                var votesArr = [];

                var order = _.chain(polls[name].votes)
                    .pairs()
                    .sortBy(function(option) { return option[1] })
                    .reverse()
                    .value();

                var orderString = "";
                for(var i=0;i<order.length;i++) {
                    orderString += order[i][0] +
                        " (" + order[i][1] + "), ";
                }
                orderString = orderString.slice(0, -2);

                event.reply(dbot.t('count', {
                    'poll': name, 
                    'description': polls[name].description, 
                    'places': orderString
                }));
            } else {
                event.reply(dbot.t('poll_unexistent', {'name': name}));
            }
        }
    };
    commands['~newpoll'].regex = [/~newpoll ([^ ]+) options=([^ ]+) (.+)/, 4];
    commands['~addoption'].regex = [/~addoption ([^ ]+) ([^ ]+)/, 3];
    commands['~rmoption'].regex = [/~rmoption ([^ ]+) ([^ ]+)/, 3];
    commands['~vote'].regex = [/~vote ([^ ]+) ([^ ]+)/, 3];
    commands['~pdesc'].regex = [/~pdesc ([^ ]+)/, 2];
    commands['~count'].regex = [/~count ([^ ]+)/, 2];

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
    
    return {
        'name': 'poll',
        'ignorable': true,
        'commands': commands,
        'pages': pages
    };
};

exports.fetch = function(dbot) {
    return poll(dbot);
}
