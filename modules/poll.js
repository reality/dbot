var poll = function(dbot) {
    var polls = dbot.db.polls;
    var commands = {
        '~newpoll': function(event) {
            var av = event.input[1] != undefined;
            var name = event.input[2];
            var options = event.input[3].split(',');
            var description = event.input[4];
            
            if(name === undefined || name === 'help') {
                event.reply(dbot.t('newpoll_usage'));
            } else {
                if(polls.hasOwnProperty(name)) {
                    event.reply(dbot.t('poll_exists', {'name': name}));
                } else {
                    if(av) {
                        polls[name] = {
                            'av': av,
                            'name': name,
                            'description': description,
                            'owner': event.user,
                            'votes': {},
                            'options': []
                        };
                        for(var i=0;i<options.length;i++) {
                            polls[name].options.push(options[i]);
                        }
                    } else {
                        polls[name] = {
                            'av': av,
                            'name': name,
                            'description': description,
                            'owner': event.user,
                            'votes': {},
                            'votees': {}
                        };
                        for(var i=0;i<options.length;i++) {
                            polls[name]['votes'][options[i]] = 0;
                        }
                    }
                    
                    event.reply(dbot.t('poll_created', {'name': name, 'description': description}) + 
                        ' - http://nourishedcloud.com:8080/polls/' + name);
                }
            }
        },

        '~addoption': function(event) {
            var name = event.input[1];
            var option = event.input[2];
            
            if(polls.hasOwnProperty(name)) {
                if(polls[name].owner === event.user) {
                    if(!polls[name].votes.hasOwnProperty(name)) {
                        polls[name]['votes'][option] = 0;
                        event.reply(dbot.t('option_added', {'user': event.user, 
                            'name': name, 'option': option}));
                    } else {
                        event.reply(dbot.t('option_exists', {'option': option,
                            'name': name, 'user': event.user}));
                    }
                } else {
                    event.reply(dbot.t('not_poll_owner', {'user': event.user,
                        'name': name}));
                }
            } else {
                event.reply(dbot.t('poll_unexistent', {'name': name}));
            }
        },

        '~rmoption': function(event) {
            var name = event.input[1];
            var option = event.input[2];
            
            if(polls.hasOwnProperty(name)) {
                if(polls[name].owner === event.user) {
                    if(polls[name].votes.hasOwnProperty(option)) {
                        delete polls[name]['votes'][option];
                        event.reply(dbot.t('option_removed', {'user': event.user,
                            'name': name, 'option': option}));
                    } else {
                        event.reply(dbot.t('invalid_vote', {'vote': option}));
                    }
                } else {
                    event.reply(dbot.t('not_poll_owner', {'name': name}));
                }
            } else {
                event.reply(dbot.t('poll_unexistent', {'name': name}));
            }
        },

        '~vote': function(event) {
            var name = event.input[1];
            var vote = event.input[2];

            if(polls.hasOwnProperty(name)) {
                if(polls[name].av) {
                    var prefs = vote.split(',');
                    prefs = prefs.uniq();
                    var valid = true;
                    
                    prefs.each(function(pref) {
                        valid = valid && polls[name].options.indexOf(pref) != -1;
                    });
                    if(valid){
                        if(polls[name].votes.hasOwnProperty(event.user)) {
                            polls[name].votes[event.user] = prefs;
                            event.reply(dbot.t('av_changed_vote', {'vote': prefs.join(','), 'poll': name, 'user': event.user}));
                        } else {
                            polls[name].votes[event.user] = prefs;
                            event.reply(dbot.t('av_voted', {'vote': prefs.join(','), 'poll': name, 'user': event.user}));
                        }
                    } else {
                        event.reply(dbot.t('invalid_vote', {'vote': vote}));
                    }
                } else {
                    if(polls[name].votes.hasOwnProperty(vote)) {
                        if(polls[name].votees.hasOwnProperty(event.user)) {
                            var oldVote = polls[name].votees[event.user];
                            polls[name].votes[oldVote]--;
                            polls[name].votes[vote]++;
                            polls[name].votees[event.user] = vote;
                            event.reply(dbot.t('changed_vote', {'vote': vote, 'poll': name,
                                'count': polls[name].votes[vote], 'user': event.user}));
                        } else {
                            polls[name].votes[vote]++;
                            polls[name].votees[event.user] = vote;
                            event.reply(dbot.t('voted', {'vote': vote, 'poll': name,
                                'count': polls[name].votes[vote], 'user': event.user}));
                        }
                    } else {
                        event.reply(dbot.t('invalid_vote', {'vote': vote}));
                    }
                }
            } else {
                event.reply(dbot.t('poll_unexistent', {'name': name}));
            }
        },

        '~pdesc': function(event) {
            var name = event.input[1];
            if(polls.hasOwnProperty(name)) {
                event.reply(name + ': ' + polls[name].description + ' - http://nourishedcloud.com:8080/polls/' + name);
            } else {
                event.reply(dbot.t('poll_unexistent', {'name': name}));
            }
        },
        
        '~count': function(event) {
            var name = event.input[1];
            
            if(polls.hasOwnProperty(name)) {
                var order;
                if(polls[name].av) {
                    var finished = false;
                    var rounds = [];
                    var eliminated = [];
                    var voted;
                    
                    for(var roundn = 0; roundn < polls[name].options.length; roundn++) {
                        var roundLoser;
                        
                        // Populate candidates for this round
                        rounds[roundn] = {};
                        polls[name].options.each(function (option) {
                            if(eliminated.indexOf(option) == -1)
                                rounds[roundn][option] = 0;
                        });
                        
                        // Count votes
                        polls[name].votes.withAll(function (name, vote) {
                            voted = false;
                            vote.each(function (pref) {
                                if(!voted && rounds[roundn].hasOwnProperty(pref)) {
                                    rounds[roundn][pref]++;
                                    voted = true;
                                }
                            });
                        });
                        
                        // Find the loser
                        var min = polls[name].votes.length() + 1;
                        rounds[roundn].withAll(function (option, count) {
                            if(count < min) {
                                roundLoser = option;
                                min = count;
                            }
                        });
                        
                        // Eliminate loser
                        eliminated.push(roundLoser);
                    }
                    order = eliminated.reverse().join(', ')
                } else {
                    var votesArr = [];
                    polls[name].votes.withAll(function(option, count) {
                        votesArr.push([option, count]);
                    });

                    votesArr = votesArr.sort(function(a, b) { return b[1] - a[1]; });
                    
                    order = votesArr.map(function(vote) { return vote[0]; });
                }
                event.reply(dbot.t('count', {'poll': name, 'description': polls[name].description, 'places': order}));
            } else {
                event.reply(dbot.t('poll_unexistent', {'name': name}));
            }
        }
    };
    commands['~newpoll'].regex = [/~newpoll (av )?([^ ]+) options=([^ ]+) (.+)/, 5];
    commands['~addoption'].regex = [/~addoption ([^ ]+) ([^ ]+)/, 3];
    commands['~rmoption'].regex = [/~rmoption ([^ ]+) ([^ ]+)/, 3];
    commands['~vote'].regex = [/~vote ([^ ]+) ([^ ]+)/, 3];
    commands['~pdesc'].regex = [/~pdesc ([^ ]+)/, 2];
    commands['~count'].regex = [/~count ([^ ]+)/, 2];

    commands['~newpoll'].usage = '~newpoll [pollname] options=[each,poll,option] [Poll Description]';
    commands['~addoption'].usage = '~addoption [pollname] [newoption]';
    commands['~rmoption'].usage= '~rmoption [pollname] [optiontoremove]';
    commands['~vote'].usage= '~vote [pollname] [option]';
    commands['~pdesc'].usage = '~pdesc [pollname]';

    return {
        'name': 'poll',
        'ignorable': true,
        'commands': commands
    };
};

exports.fetch = function(dbot) {
    return poll(dbot);
}
