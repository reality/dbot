var poll = function(dbot) {
    if(!dbot.db.hasOwnProperty('polls')) {
        dbot.db.polls = {};
    }
    var polls = dbot.db.polls;
    var commands = {
        '~newpoll': function(event) {
            var name = event.input[1];
            var options = event.input[2].split(',');
            var description = event.input[3];
            
            if(name === undefined || name === 'help') {
                event.reply(dbot.t('newpoll_usage'));
            } else {
                if(polls.hasOwnProperty(name)) {
                    event.reply(dbot.t('poll_exists', {'name': name}));
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
                    
                    event.reply(dbot.t('poll_created', {'name': name, 'description': description}));
                }
            }
        },

        '~vote': function(event) {
            var name = event.input[1];
            var vote = event.input[2];

            if(polls.hasOwnProperty(name)) {
                if(polls[name].votes.hasOwnProperty(vote)) {
                    if(polls[name].votees.hasOwnProperty(event.user)) {
                        var oldVote = polls[name].votees[event.user];
                        polls[name].votes[oldVote]--;
                        polls[name].votes[vote]++;
                        polls[name].votees[event.user] = vote;
                        event.reply(dbot.t('changed_voted', {'vote': vote, 'poll': name,
                            'count': polls[name].votes[vote]}));
                    } else {
                        polls[name].votes[vote]++;
                        polls[name].votees[event.user] = vote;
                        event.reply(dbot.t('voted', {'vote': vote, 'poll': name,
                            'count': polls[name].votes[vote]}));
                    }
                } else {
                    event.reply(dbot.t('invalid_vote', {'vote': vote}));
                }
            } else {
                event.reply(dbot.t('poll_unexistent', {'name': name}));
            }
        },

        '~viewpoll': function(event) {
            var name = event.input[1];
            if(polls.hasOwnProperty(name)) {

            } else {
                event.reply(dbot.t('poll_unexistent', {'name': name}));
            }
        }
    };
    commands['~newpoll'].regex = [/~newpoll ([^ ]+) \[options=([^ ]+)\] (.+)/, 4];
    commands['~vote'].regex = [/~vote ([^ ]+) ([^ ]+)/, 3];
    commands['~viewpoll'].regex = [/~viewpoll ([^ ]+)/, 2];

    return {
        'name': 'poll',
        'ignorable': true,
        'commands': commands
    };
};

exports.fetch = function(dbot) {
    return poll(dbot);
}
