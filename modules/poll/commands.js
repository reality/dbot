var _ = require('underscore')._,
    databank = require('databank'),
    AlreadyExistsError = databank.AlreadyExistsError,
    NoSuchThingError = databank.NoSuchThingError;

var commands = function(dbot) {
    var commands = {
        '~newpoll': function(event) {
            var name = event.input[1].toLowerCase(),
                options = event.input[2].toLowerCase().split(','),
                description = event.input[3];
                
            _.each(options, function(item, index, list) { list[index] = [ item, 0 ]; })
            votes = _.object(options);

            this.db.create('poll', name, {
                'name': name,
                'description': description,
                'owner': event.rUser.id,
                'votes': votes,
                'votees': {}
            }, function(err, value) {
                if(!err) {
                    event.reply(dbot.t('poll_created', {
                        'name': name, 
                        'description': description, 
                        'url': dbot.api.web.getUrl('poll/' + name)     
                    })); 
                } else if(err instanceof AlreadyExistsError) {
                    event.reply(dbot.t('poll_exists', { 'name': name }));
                }
            });
        },

        '~addoption': function(event) {
            var name = event.input[1].toLowerCase(),
                option = event.input[2].toLowerCase();
            
            this.db.read('poll', name, function(err, poll) {
                if(!err) {
                    if(poll.owner === event.rUser.id) {
                        if(!_.has(poll.votes, option)) {
                            poll.votes[option] = 0;
                            this.db.save('poll', name, poll, function(err) {
                                event.reply(dbot.t('option_added', {
                                    'user': event.user, 
                                    'name': name, 
                                    'option': option
                                }));
                            });
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
                    if(err instanceof NoSuchThingError) {
                        event.reply(dbot.t('poll_unexistent', { 'name': name }));
                    }
                }
            }.bind(this));
        },

        '~rmoption': function(event) {
            var name = event.input[1].toLowerCase(),
                option = event.input[2].toLowerCase();

            this.db.read('poll', name, function(err, poll) {
                if(!err) {
                    if(poll.owner === event.rUser.id) {
                        if(_.has(poll.votes, option)) {
                            delete poll.votes[option];

                            this.db.save('poll', name, poll, function(err) {
                                event.reply(dbot.t('option_removed', {
                                    'user': event.user,
                                    'name': name, 
                                    'option': option
                                }));
                            }.bind(this));
                        } else {
                            event.reply(dbot.t('invalid_vote', { 'vote': option }));
                        }
                    } else {
                        event.reply(dbot.t('not_poll_owner', { 'name': name }));
                    }
                } else {
                    if(err instanceof NoSuchThingError) {
                        event.reply(dbot.t('poll_unexistent', { 'name': name }));
                    }
                }
            }.bind(this));
        },

        '~vote': function(event) {
            var name = event.input[1].toLowerCase(),
                vote = event.input[2].toLowerCase();
            
            this.db.read('poll', name, function(err, poll) {
                if(!err) {
                    if(_.has(poll.votes, vote)) {
                        if(_.has(poll.votees, event.rUser.id)) {
                            var oldVote = poll.votees[event.rUser.id];
                            poll.votes[oldVote]--;
                            poll.votes[vote]++;
                            poll.votees[event.rUser.id] = vote;
                        } else {
                            poll.votes[vote]++;
                            poll.votees[event.rUser.id] = vote;
                        }

                        this.db.save('poll', name, poll, function(err) {
                            event.reply(dbot.t('voted', {
                                'vote': vote, 
                                'poll': name,
                                'count': poll.votes[vote], 
                                'user': event.user
                            }));
                        }.bind(this));
                    } else {
                        event.reply(dbot.t('invalid_vote', { 'vote': vote }));
                    }
                } else {
                    if(err instanceof NoSuchThingError) {
                        event.reply(dbot.t('poll_unexistent', { 'name': name }));
                    }
                }
            }.bind(this));
        },

        '~pdesc': function(event) {
            var name = event.input[1].toLowerCase();
            this.db.read('poll', name, function(err, poll) {
                if(!err) {
                    var options = _.keys(poll.votes);
                    var optionString = " Choices: ";
                    for(var i=0;i<options.length;i++) {
                        optionString += options[i] + ', ';
                    }
                    optionString = optionString.slice(0, -2) + '.';

                    event.reply(dbot.t('poll_describe', {
                        'name': name, 
                        'description': poll.description,
                        'url': dbot.api.web.getUrl('poll/' + name) 
                    }) + optionString);
                } else {
                    if(err instanceof NoSuchThingError) {
                        event.reply(dbot.t('poll_unexistent', { 'name': name }));
                    }
                }
            });
        },
        
        '~count': function(event) {
            var name = event.input[1].toLowerCase();
            this.db.read('poll', name, function(err, poll) {
                if(!err) {
                    var order;
                    var votesArr = [];

                    var order = _.chain(poll.votes)
                        .pairs()
                        .sortBy(function(option) { return option[1]; })
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
                        'description': poll.description, 
                        'places': orderString
                    }));
                } else {
                    if(err instanceof NoSuchThingError) {
                        event.reply(dbot.t('poll_unexistent', {'name': name}));
                    }
                }
            });
        }
    };
    commands['~newpoll'].regex = [/newpoll ([^ ]+) options=([^ ]+) (.+)/, 4];
    commands['~addoption'].regex = [/addoption ([^ ]+) ([^ ]+)/, 3];
    commands['~rmoption'].regex = [/rmoption ([^ ]+) ([^ ]+)/, 3];
    commands['~vote'].regex = [/vote ([^ ]+) ([^ ]+)/, 3];
    commands['~pdesc'].regex = [/pdesc ([^ ]+)/, 2];
    commands['~count'].regex = [/count ([^ ]+)/, 2];

    return commands;
};

exports.fetch = function(dbot) {
    return commands(dbot);
}
