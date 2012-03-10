var fs = require('fs');
var timers = require('./timer');
var jsbot = require('./jsbot');
require('./snippets');

var DBot = function(timers) {
    // Load external files
    this.config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
    try {
        this.db = JSON.parse(fs.readFileSync('db.json', 'utf-8'));
    } catch (e) {
        this.db = {};
    } finally {  /* fill any missing parts of the db; if this is a new DB, that's all of them */
        if(!this.db.hasOwnProperty("bans")) {
            this.db.bans = {};
        }
        if(!this.db.bans.hasOwnProperty("*")) {
            this.db.bans["*"] = [];
        }
        if(!this.db.hasOwnProperty("quoteArrs")) {
            this.db.quoteArrs = {};
        }
        if(!this.db.quoteArrs.hasOwnProperty("realityonce")) {
            this.db.quoteArrs.realityonce = [];
        }
        if(!this.db.hasOwnProperty("kicks")) {
            this.db.kicks = {};
        }
        if(!this.db.hasOwnProperty("kickers")) {
            this.db.kickers = {};
        }
        if(!this.db.hasOwnProperty("modehate")) {
            this.db.modehate = [];
        }
        if(!this.db.hasOwnProperty("locks")) {
            this.db.locks = [];
        }
    }

    // Populate bot properties with config data
    this.name = this.config.name || 'dbox';
    this.admin = this.config.admin || 'reality';
    this.password = this.config.password || 'lolturtles';
    this.nickserv = this.config.nickserv || 'zippy';
    this.server = this.config.server || 'elara.ivixor.net';
    this.port = this.config.port || 6667;
    this.moduleNames = this.config.modules || [ 'js', 'admin', 'kick', 'modehate', 'quotes', 'puns', 'spelling', 'web', 'youare' ];

    this.timers = timers.create();

    this.instance = jsbot.createJSBot(this.name, this.server, this.port, this, function() {
            if(this.config.hasOwnProperty('channels')) {
                this.config.channels.each(function(channel) {
                    this.instance.join(channel);
                }.bind(this));
        }
    }.bind(this), this.nickserv, this.password);

    // Load the modules and connect to the server
    this.reloadModules();
    this.instance.connect();
};

// Retrieve a random quote from a given category, interpolating any quote references (~~QUOTE CATEGORY~~) within it
DBot.prototype.interpolatedQuote = function(key) {
    var quoteString = this.db.quoteArrs[key].random();
    var quoteRefs = quoteString.match(/~~([\d\w\s-]*)~~/);
    if (quoteRefs) {
        quoteRefs = quoteRefs.slice(1);
        for(var i=0;i<quoteRefs.length;i++) {
            var cleanRef = this.cleanNick(quoteRefs[i].trim());
            if (this.db.quoteArrs.hasOwnProperty(cleanRef)) {
                quoteString = quoteString.replace("~~"+cleanRef+"~~", this.db.quoteArrs[cleanRef].random());
            }
        }
    }
    return quoteString;
};

// Say something in a channel
DBot.prototype.say = function(channel, data) {
    this.instance.say(channel, data);
};

DBot.prototype.act = function(channel, data) {
    this.instance.send('PRIVMSG', channel, ':\001ACTION ' + data + '\001');
}

// Save the database file
DBot.prototype.save = function() {
    fs.writeFile('db.json', JSON.stringify(this.db, null, '    '));
};

// Hot-reload module files.
DBot.prototype.reloadModules = function() {
    if(this.modules) { // Run 'onDestroy' code for each module if it exists.
        this.modules.each(function(module) {
            if(module.onDestroy) {
                module.onDestroy();
            }
        });
    }

    this.rawModules = [];
    this.modules = [];
    this.commands = {};
    this.timers.clearTimers();
    this.save();

    // Reload Javascript snippets
    var path = require.resolve('./snippets');
    delete require.cache[path];
    require('./snippets');

    this.moduleNames.each(function(name) {
        var cacheKey = require.resolve('./modules/' + name);
        delete require.cache[cacheKey];
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
            if((this.db.bans.hasOwnProperty(params[0]) && 
                    this.db.bans[params[0]].include(data.user)) || this.db.bans['*'].include(data.user))
                this.say(data.channel, data.user + 
                    ' is banned from using this command. Commence incineration.'); 
            else {
                this.commands[params[0]](data, params);
                this.save();
            }
        } else {
            var q = data.message.valMatch(/^~([\d\w\s-]*)/, 2);
            if(q) {
                if(this.db.bans['*'].include(data.user)) {
                    this.say(data.channel, data.user + 
                        ' is banned from using this command. Commence incineration.'); 
                } else {
                    q[1] = q[1].trim();
                    key = this.cleanNick(q[1])
                    if(this.db.quoteArrs.hasOwnProperty(key)) {
                        this.say(data.channel, q[1] + ': ' + this.interpolatedQuote(key));
                    } else {
                        // See if it's similar to anything
                        var winnerDistance = Infinity;
                        var winner = false;
                        for(var commandName in this.commands) {
                            var distance = String.prototype.distance(params[0], commandName);
                            if(distance < winnerDistance) {
                                winner = commandName;
                                winnerDistance = distance;
                            }
                        }

                        if(winnerDistance < 3) {
                            this.say(data.channel, 'Did you mean ' + winner + '? Learn to type, hippie!');
                        }
                    }
                }
            }
        }
    }.bind(this));
};

DBot.prototype.cleanNick = function(key) {
    key = key.toLowerCase();
    while(key.endsWith("_")) {
        if(this.db.quoteArrs.hasOwnProperty(key)) {
            return key;
        }
        key = key.substring(0, key.length-1);
    }
    return key;
}

new DBot(timers);
