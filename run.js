var fs = require('fs');
var jsbot = require('./jsbot');
var quote = require('./quotes');

///////////////////////////

Array.prototype.random = function() {
    return this[Math.floor((Math.random()*this.length))];
};

///////////////////////////



///////////////////////////

var dbot = function(quotes) {
    var admin = 'reality';
    var waitingForKarma = false;
    var name = 'depressionbot';
    var db = JSON.parse(fs.readFileSync('db.json', 'utf-8'));
    var quotes = quotes(db.quoteArrs);

    var adminCommands = {
        'join': function(data, params) {
            instance.join(params[1]); 
            instance.say(admin, 'Joined ' + params[1]);
        },

        'part': function(data, params) {
            instance.part(params[1]);
            instance.say(admin);
        },

        'reload': function(data, params) {
            instance.say(admin, 'Reloading DB.');
            try {
                db = JSON.parse(fs.readFileSync('db.json', 'utf-8'));
            } catch(err) {
                instance.say(admin, 'DB reload failed.');
            } finally {
                instance.say(admin, 'DB Reload successful.');
            }
        },

        'say': function(data, params) {
            var c = params[1];
            var m = params.slice(2).join(' ');
            instance.say(c, m);
        }
    };

    var userCommands = {
        '~kc': function(data, params) {
            instance.say('aisbot', '.karma ' + data.message.split(' ')[1]);
            waitingForKarma = data.channel;
        },

        '~q': function(data, params) {
            var q = data.message.match(/~q ([\d\w\s]*)/)
            if(q != undefined) {
                instance.say(data.channel, quotes.get(q[1].trim()));
            }
        },

        '~qadd': function(data, params) {
            var q = data.message.match(/~qadd ([\d\w\s]*)=(.+)$/);
            if(q != null && q.length >= 3) {
                instance.say(data.channel, quotes.add(q));
                fs.writeFile('db.json', JSON.stringify(db, null, '    '));
            } else {
                instance.say(data.channel, 'Burn the invalid syntax!');
            }
        },

        '~qset': function(data, params) {
            var q = data.message.match(/~qset ([\d\w\s]*)=(.+)$/);
            if(q != undefined && q.length >= 3) {
                instance.say(data.channel, quotes.set(q));
            }
        },

        '~qcount': function(data, params) {
            var q = data.message.match(/~qcount ([\d\w\s]*)/)[1].trim();
            if(q != undefined) {
                instance.say(data.channel, quotes.count(q));
            }
        },

        '~reality': function(data, params) {
            instance.say(data.channel, db.realiPuns.random());
        },

        '~d': function(data, params) {
            instance.say(data.channel,  data.user + ': ' + db.quoteArrs['depressionbot'].random());
        },

        '~rq': function(data, params) {
            instance.say(data.channel, quotes.random());
        },

        '~kickcount': function(data, params) {
            if(db.kicks[params[1]] == undefined) {
                instance.say(data.channel, params[1] + ' has either never been kicked or does not exist.');
            } else {
                instance.say(data.channel, params[1] + ' has been kicked ' + db.kicks[params[1]] + ' times.');
            }
        }
    };

    var instance = jsbot.createJSBot(name, 'elara.ivixor.net', 6667, function() {
        instance.join('#realitest');
        instance.join('#42');
        instance.join('#itonlygetsworse');
    }.bind(this));

    instance.addListener('JOIN', function(data) {
        if(data.user == 'Lamp') {
            instance.say(data.channel, db.quoteArrs.lamp.random());
        } else if(data.user == 'reality') {
            instance.say(data.channel, db.realiPuns.random());
        } else if(instance.inChannel(data.channel)) {
            instance.say('aisbot', '.karma ' + data.user);
            waitingForKarma = data.channel;
        }
    });

    instance.addListener('KICK', function(data) {
        if(data.kickee == name) {
            instance.join(data.channel);
            instance.say(data.channel, 'Thou shalt not kick ' + name);
            db.kicks[name] += 1;
        } else {
            if(db.kicks[data.kickee] == undefined) {
                db.kicks[data.kickee] = 1;
            } else {
                db.kicks[data.kickee] += 1;
            }
            instance.say(data.channel, data.kickee + '-- (' + data.kickee + ' has been kicked ' + db.kicks[data.kickee] + ' times)');
        }
        fs.writeFile('db.json', JSON.stringify(db, null, '    '));
    });

    instance.addListener('PRIVMSG', function(data) {
        if(data.user == 'aisbot' && data.channel == name && waitingForKarma != false && data.message.match(/is at/)) {
            var split = data.message.split(' ');
            var target = split[0];
            var karma = split[3];

            if(karma.startsWith('-')) {
                instance.say(waitingForKarma, target + db.hatedPhrases.random() + ' (' + karma + ')');
            } else if(karma == '0') {
                instance.say(waitingForKarma, 'All ' + target + ' knows is that their gut says \'maybe.\' (0)');
            } else {
                instance.say(waitingForKarma, target + db.lovedPhrases.random() + ' (' + karma + ')');
            }

            waitingForKarma = false;
        }
    });

    instance.addListener('PRIVMSG', function(data) { 
        params = data.message.split(' ');
        if(data.user == admin && data.channel == name && adminCommands[params[0]] != undefined) {
            adminCommands[params[0]](data, params);
        } else {
            if(data.channel == name) data.channel = data.user;

            if(userCommands[params[0]] != undefined) {
                userCommands[params[0]](data, params);
            } else {
                var q = data.message.match(/^~([\d\w\s]*)/)
                if(q != undefined) {
                    instance.say(data.channel, quotes.get(q[1].trim()));
                }
            }
        }
    });

    instance.addListener('PRIVMSG', function(data) {
        if(data.user == 'reality') {
            var once = data.message.match(/I ([\d\w\s]* once.)/);
            if(once != null) {
                db.realiPuns.push('reality ' + once[1]);
                instance.say(data.channel, '\'reality ' + once[1] + '\' saved.');
                fs.writeFile('db.json', JSON.stringify(db, null, '    '));
            }
        }
    });

    return this;
}(quote.fetch());


