/**
 * Module Name: Drama
 * Description: Experimental, you probably don't want it.
 */
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
        '~train': function(event) {
            if(dbot.admin.include(event.user)) {
                bayes.train(last[event.params[1]][event.params[2]], event.params[3]);
                event.reply('Last thing ' + event.params[2] + ' said in ' + 
                        event.params[1] + ' (' +  last[event.params[1]][event.params[2]] + ') classified as \'' + event.params[3] + '\'');
            }
        }, 

        '~rtrain': function(event) {
            if(dbot.admin.include(event.user)) {
                var category = event.params[1];
                event.params.splice(0, 2);
                var msg = event.params.join(' ');
                bayes.train(msg, category);
                event.reply('\'' + msg + '\' classified as \'' + category + '\'');
            }
        },
        
        '~classify': function(event) {
            event.params.splice(0, 1);
            var msg = event.params.join(' ');
            bayes.classify(msg, function(category) {
                event.reply('Classified as: ' + category + '!');
            }.bind(this));
        }
    }

    return {
        'name': 'drama',
        'ignorable': false,
        'commands': commands,

        'listener': function(data) {
            var category = bayes.classify(data.message, function(category) {
                if(category !== 'normal') {
                    if(category === 'beinganasshole') {
                        if(dbot.db.drama.beinganasshole.hasOwnProperty(event.user)) {
                            dbot.db.drama.beinganasshole[event.user]++;
                        } else {
                            dbot.db.drama.beinganasshole[event.user] = 1;
                        }
                    } else if(category === 'sd') {
                        if(dbot.db.drama.sd.hasOwnProperty(event.user)) {
                            dbot.db.drama.sd[event.user]++;
                        } else {
                            dbot.db.drama.sd[event.user] = 1;
                        }
                    }
                }
            }.bind(this));

            if(last.hasOwnProperty(event.channel)) {
               last[event.channel][event.user] = data.message; 
            } else {
                last[event.channel] = { };
                last[event.channel][event.user] = data.message;
            }
        },
        'on': 'PRIVMSG'
    };
}

exports.fetch = function(dbot) {
    return drama(dbot);
};
