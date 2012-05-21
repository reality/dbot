var brain = require('brain');

var drama = function(dbot) {
    var dbot = dbot;
    var last = {};
    var options = {
        'backend': {
            'type': 'Redis',
            'options': {
                'hostname': 'localhost',
                'port': 6379,
                'name': 'dbotdrama'
            }
        },

        'thresholds': {
            'drama': 3,
            'beinganasshole': 3,
            'sd': 3, // self depracating
            'normal': 1
        },

        'def': 'normal'
    };
    var bayes = new brain.BayesianClassifier(options);

    var commands = {
        '~train': function(data, params) {
            if(dbot.admin.include(data.user)) {
                bayes.train(last[params[1]][params[2]], params[3]);
                dbot.say(data.channel, 'Last thing ' + params[2] + ' said in ' + 
                        params[1] + ' (' +  last[params[1]][params[2]] + ') classified as \'' + params[3] + '\'');
            }
        }, 

        '~rtrain': function(data, params) {
            if(dbot.admin.include(data.user)) {
                var category = params[1];
                params.splice(0, 2);
                var msg = params.join(' ');
                bayes.train(msg, category);
                dbot.say(data.channel, '\'' + msg + '\' classified as \'' + category + '\'');
            }
        },
        
        '~classify': function(data, params) {
            params.splice(0, 1);
            var msg = params.join(' ');
            bayes.classify(msg, function(category) {
                dbot.say(data.channel, 'Classified as: ' + category + '!');
            }.bind(this));
        }
    }

    return {
        'onLoad': function() {
            return commands;
        },

        'listener': function(data) {
            var category = bayes.classify(data.message, function(category) {
                if(category !== 'normal') {
                    if(category === 'beinganasshole') {
                        if(dbot.db.drama.beinganasshole.hasOwnProperty(data.user)) {
                            dbot.db.drama.beinganasshole[data.user]++;
                        } else {
                            dbot.db.drama.beinganasshole[data.user] = 1;
                        }
                    } else if(category === 'sd') {
                        if(dbot.db.drama.sd.hasOwnProperty(data.user)) {
                            dbot.db.drama.sd[data.user]++;
                        } else {
                            dbot.db.drama.sd[data.user] = 1;
                        }
                    }
                }
            }.bind(this));

            if(last.hasOwnProperty(data.channel)) {
               last[data.channel][data.user] = data.message; 
            } else {
                last[data.channel] = { };
                last[data.channel][data.user] = data.message;
            }
        },

        'on': 'PRIVMSG',

        'name': 'drama',

        'ignorable': false
    };
}

exports.fetch = function(dbot) {
    return drama(dbot);
};
