var fs = require('fs');
var timers = require('./timer');
var jsbot = require('./jsbot');
require('./snippets');

var modules = ['user', 'admin', 'puns', 'kick', 'reality', 'karma', 'youare', 'quotes'];

var DBot = function(dModules, timers) {
    this.admin = 'reality';
    this.waitingForKarma = false;
    this.name = 'deressionbot';
    this.db = JSON.parse(fs.readFileSync('db.json', 'utf-8'));
    this.timers = timers.create();

    this.instance = jsbot.createJSBot(this.name, 'elara.ivixor.net', 6667, this, function() {
        this.instance.join('#realitest');
        this.instance.join('#fail');
        this.instance.join('#42');
        this.instance.join('#itonlygetsworse');
    }.bind(this));

    this.moduleNames = dModules;
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
    this.commands = {};
    this.timers.clearTimers();

    var path = require.resolve('./snippets');
    require.cache[path] = undefined;
    require('./snippets');

    this.moduleNames.each(function(name) {
        var cacheKey = require.resolve('./modules/' + name);
        require.cache[cacheKey] = undefined; // TODO: snippet to remove element properly
        try {
            this.rawModules.push(require('./modules/' + name));
        } catch(err) {
            console.log('Failed to load module: ' + name);
        }
    }.bind(this));

    this.instance.removeListeners();

    this.modules = this.rawModules.collect(function(rawModule) {
        var module = rawModule.fetch(this);

        if(module.listener) {
            this.instance.addListener(module.on, module.listener);
        }

        if(module.onLoad) {
            var newCommands = module.onLoad();
            for(key in newCommands) {
                if(newCommands.hasOwnProperty(key) && Object.prototype.isFunction(newCommands[key])) {
                    this.commands[key] = newCommands[key];
                }
            }
        }

        return module;
    }.bind(this));

    this.instance.addListener('PRIVMSG', function(data) {
        params = data.message.split(' ');
        if(data.channel == this.name) data.channel = data.user;

        if(this.commands.hasOwnProperty(params[0])) {
            this.commands[params[0]](data, params);
            this.save();
        } else {
            var q = data.message.valMatch(/^~([\d\w\s]*)/, 2);
            if(q) {
                key = q[1].trim().toLowerCase();
                if(this.db.quoteArrs.hasOwnProperty(key)) {
                    this.say(data.channel, key + ': ' + this.db.quoteArrs[key].random());
                } else {
                    this.say(data.channel, 'No quotes under ' + key);
                }
            }
        }
    }.bind(this));
};

new DBot(modules, timers);
