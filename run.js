require('./snippets');
var fs = require('fs');
var jsbot = require('./jsbot');

var modules = ['user', 'admin', 'puns', 'kick', 'reality', 'karma'];

var DBot = function(dModules, quotes) {
    this.admin = 'reality';
    this.waitingForKarma = false;
    this.name = 'depressionbot';
    this.db = JSON.parse(fs.readFileSync('db.json', 'utf-8'));
    this.quotes = require(quotes).fetch(this);

    this.instance = jsbot.createJSBot(this.name, 'elara.ivixor.net', 6667, this, function() {
        this.instance.join('#realitest');
    }.bind(this));

    this.moduleNames = dModules;
    this.rawModules = [];
    this.modules = [];

    this.reloadModules();
    
    this.instance.connect();
};

DBot.prototype.say = function(channel, data) {
    this.instance.say(channel, data);
};

DBot.prototype.save = function() {
    fs.writeFile('db.json', JSON.stringify(this.db, null, '    '));
};

DBot.prototype.reloadModules = function() {
    this.rawModules = [];
    this.modules = [];

    this.moduleNames.each(function(name) {
        var cacheKey = require.resolve('./modules/' + name);
        require.cache[cacheKey] = undefined; // TODO: snippet to remove element properly
        this.rawModules.push(require('./modules/' + name));
    }.bind(this));

    this.instance.removeListeners();

    this.modules = this.rawModules.collect(function(rawModule) {
        var module = rawModule.fetch(this);
        this.instance.addListener(module.on, module.listener);
        return module;
    }.bind(this));
};

new DBot(modules, './modules/quotes');
