var poll = function(dbot) {
    var polls = dbot.db.polls;
    var commands = {
        '~newpoll': function(event) {
            var name = event.input[1];
            if(name === undefined || name === 'help') {
                event.reply(dbot.t('newpoll_usage'));
            } else {
                if(polls.hasOwnProperty(name)) {
                    event.reply(dbot.t('poll_exists'));
                } else {
                    polls[name] = {
                        'name': name,
                        'owner': event.user
                    };

                    var options = event.input[2].split(',');
                    for(var i=0;i<options.length;i++) {
                        polls[name]['votes'][options[i]] = 0;
                    }
                }
            }
        },

        '~vote': function(event) {

        },

        '~rmpoll': function(event) {

        },

        '~results': function(event) {

        }
    };
    commands['~newpoll'].regex = [/~newpoll ([\d\w\s-]+?)[ ]?=[ ]?(.+)$/, 3];

    return {
        'name': 'poll',
        'ignorable': true,
        'commands': commands
    };
};

exports.fetch = function(dbot) {
    return poll(dbot);
}
