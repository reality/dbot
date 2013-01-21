var _ = require('underscore')._;

var commands = function(dbot) {
    var polls = dbot.db.polls;
    var commands = {
        '~newpoll': function(event) {
            var name = event.input[1].toLowerCase(),
                options = event.input[2].toLowerCase().split(','),
                description = event.input[3];
            
            if(_.has(polls, name)) {
                event.reply(dbot.t('poll_exists', { 'name': name }));
            } else {
                polls[name] = {
                    'name': name,
                    'description': description,
                    'owner': dbot.api.users.resolveUser(event.server, event.user),
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
            var name = event.input[1].toLowerCase(),
                option = event.input[2].toLowerCase(),
                user = dbot.api.users.resolveUser(event.server, event.user);
            
            if(_.has(polls, name)) {
                if(polls[name].owner === user) {
                    if(!_.has(polls[name].votes, option)) {
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
            var name = event.input[1].toLowerCase(),
                option = event.input[2].toLowerCase(),
                user = dbot.api.users.resolveUser(event.server, event.user);
            
            if(_.has(polls, name)) {
                if(polls[name].owner === user) {
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
            var name = event.input[1].toLowerCase(),
                vote = event.input[2].toLowerCase(),
                user = dbot.api.users.resolveUser(event.server, event.user);

            if(_.has(polls, name)) {
                if(_.has(polls[name].votes, vote)) {
                    if(_.has(polls[name].votees, user)) {
                        var oldVote = polls[name].votees[user];
                        polls[name].votes[oldVote]--;
                        polls[name].votes[vote]++;
                        polls[name].votees[user] = vote;

                        event.reply(dbot.t('changed_vote', {
                            'vote': vote, 
                            'poll': name,
                            'count': polls[name].votes[vote], 
                            'user': event.user
                        }));
                    } else {
                        polls[name].votes[vote]++;
                        polls[name].votees[user] = vote;
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
            var name = event.input[1].toLowerCase();

            if(_.has(polls, name)) {
                var options = _.keys(polls[name].votes);
                var optionString = " Choices: ";
                for(var i=0;i<options.length;i++) {
                    optionString += options[i] + ', ';
                }
                optionString = optionString.slice(0, -2) + '.';

                event.reply(dbot.t('poll_describe', {
                    'name': name, 
                    'description': polls[name].description,
                    'url': dbot.t('url', {
                        'host': dbot.config.web.webHost, 
                        'port': dbot.config.web.webPort, 
                        'path': 'polls/' + name
                    })
                }) + optionString);
            } else {
                event.reply(dbot.t('poll_unexistent', { 'name': name }));
            }
        },
        
        '~count': function(event) {
            var name = event.input[1].toLowerCase();
            
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

    return commands;
};

exports.fetch = function(dbot) {
    return commands(dbot);
}
