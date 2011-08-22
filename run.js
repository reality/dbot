require('./snippets');
var fs = require('fs');
var jsbot = require('./jsbot');
var quote = require('./modules/quotes');
var userCommands = require('./modules/user');
var adminCommands = require('./modules/admin');
var puns = require('./modules/puns');
var kick = require('./modules/kick');
var reality = require('./modules/reality');
var karma = require('./modules/karma');

var dbot = Class.create({
    initialize: function(dModules, quotes) {
        this.admin = 'reality';
        this.waitingForKarma = false;
        this.name = 'depressionbot';
        this.db = JSON.parse(fs.readFileSync('db.json', 'utf-8'));
        this.quotes = quotes.fetch(this);

        this.instance = jsbot.createJSBot(this.name, 'elara.ivixor.net', 6667, this, function() {
            this.instance.join('#realitest');
            this.instance.join('#42');
            this.instance.join('#fail');
            this.instance.join('#itonlygetsworse');
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
