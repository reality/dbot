var fs = require('fs');
var jsbot = require('./jsbot');
var quote = require('./quotes');
var userCommands = require('./user');

///////////////////////////

Array.prototype.random = function() {
    return this[Math.floor((Math.random()*this.length))];
};

///////////////////////////


this.adminCommands = {
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


///////////////////////////
var dbot = Class.create({
    initialize: function(quotes, userCommands) {
        this.admin = 'reality';
        this.waitingForKarma = false;
        this.name = 'depressionbot';
        this.db = JSON.parse(fs.readFileSync('db.json', 'utf-8'));
        this.quotes = quotes(this.db.quoteArrs);
        this.userCommands = userCommands.fetch(this);

        this.instance = jsbot.createJSBot(this.name, 'elara.ivixor.net', 6667, this, function() {
            this.instance.join('#realitest');
        }.bind(this));

        this.instance.addListener(this.userCommands.on, this.userCommands.listener);

        this.instance.addListener('JOIN', function(data) {
            if(data.user == 'Lamp') {
                this.instance.say(data.channel, db.quoteArrs.lamp.random());
            } else if(data.user == 'reality') {
                this.instance.say(data.channel, db.realiPuns.random());
            } else if(instance.inChannel(data.channel)) {
                this.instance.say('aisbot', '.karma ' + data.user);
                this.waitingForKarma = data.channel;
            }
        });

        this.instance.addListener('KICK', function(data) {
            if(data.kickee == name) {
                this.instance.join(data.channel);
                this.instance.say(data.channel, 'Thou shalt not kick ' + name);
                this.db.kicks[name] += 1;
            } else {
                if(this.db.kicks[data.kickee] == undefined) {
                    this.db.kicks[data.kickee] = 1;
                } else {
                    this.db.kicks[data.kickee] += 1;
                }
                instance.say(data.channel, data.kickee + '-- (' + data.kickee + ' has been kicked ' + this.db.kicks[data.kickee] + ' times)');
            }

            this.save();
        });

        this.instance.addListener('PRIVMSG', function(data) {
            if(data.user == 'aisbot' && data.channel == name && waitingForKarma != false && data.message.match(/is at/)) {
                var split = data.message.split(' ');
                var target = split[0];
                var karma = split[3];

                if(karma.startsWith('-')) {
                    this.instance.say(waitingForKarma, target + this.db.hatedPhrases.random() + ' (' + karma + ')');
                } else if(karma == '0') {
                    this.instance.say(waitingForKarma, target + this.db.neutralPhrases.random() + ' (0)');
                } else {
                    this.instance.say(waitingForKarma, target + this.db.lovedPhrases.random() + ' (' + karma + ')');
                }

                waitingForKarma = false;
            }
        });

        this.instance.addListener('PRIVMSG', function(data) {
            if(data.user == 'reality') {
                var once = data.message.match(/I ([\d\w\s]* once.)/);
                if(once != null) {
                    this.db.realiPuns.push('reality ' + once[1]);
                    this.instance.say(data.channel, '\'reality ' + once[1] + '\' saved.');
                    this.save();
                }
            }
        });
    },

    say: function(channel, data) {
        this.instance.say(channel, data);
    },

    save: function() {
        fs.writeFile('db.json', JSON.stringify(this.db, null, '    '));
    }
});

new dbot(quote.fetch(), userCommands);
