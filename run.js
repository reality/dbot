var fs = require('fs');
var jsbot = require('./jsbot');
var quote = require('./quotes');
var userCommands = require('./user');
var adminCommands = require('./admin');
var puns = require('./puns');
var kick = require('./kick');
var reality = require('./reality');
var karma = require('./karma');

///////////////////////////

Array.prototype.random = function() {
    return this[Math.floor((Math.random()*this.length))];
};

///////////////////////////

var dbot = Class.create({
    initialize: function(dModules, quotes) {
        this.admin = 'reality';
        this.waitingForKarma = false;
        this.name = 'depressionbot';
        this.db = JSON.parse(fs.readFileSync('db.json', 'utf-8'));
        this.quotes = quotes.fetch(this);

        this.instance = jsbot.createJSBot(this.name, 'elara.ivixor.net', 6667, this, function() {
            this.instance.join('#realitest');
        }.bind(this));

        this.modules = dModules.collect(function(n) {
            var module = n.fetch(this);
            this.instance.addListener(module.on, module.listener);
            return n.fetch(this);
        }.bind(this));

        this.instance.connect();
    },

    say: function(channel, data) {
        this.instance.say(channel, data);
    },

    save: function() {
        fs.writeFile('db.json', JSON.stringify(this.db, null, '    '));
    }
});

new dbot([userCommands, adminCommands, puns, kick, reality, karma], quote);
