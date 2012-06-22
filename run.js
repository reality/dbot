var fs = require('fs');
var timers = require('./timer');
var jsbot = require('./jsbot');
require('./snippets');

var DBot = function(timers) {
    // Load external files
    this.config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
    this.db = null;
    var rawDB;
    try {
        var rawDB = fs.readFileSync('db.json', 'utf-8');
    } catch (e) {
        this.db = {};  // If no db file, make empty one
    }
    if(!this.db) {  // If it wasn't empty 
        this.db = JSON.parse(rawDB);
    }

    // Repair any deficiencies in the DB; if this is a new DB, that's everything
    if(!this.db.hasOwnProperty("bans")) {
        this.db.bans = {};
    }
    if(!this.db.bans.hasOwnProperty("*")) {
        this.db.bans["*"] = [];
    }
    if(!this.db.hasOwnProperty("quoteArrs")) {
        this.db.quoteArrs = {};
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
    if(!this.db.hasOwnProperty("ignores")) {
        this.db.ignores = {};
    }
    if(!this.db.hasOwnProperty('polls')) {
        this.db.polls = {};
    }
    
    // Load Strings file
    this.strings = JSON.parse(fs.readFileSync('strings.json', 'utf-8'));

    // Initialise run-time resources
    this.sessionData = {};
    this.timers = timers.create();

    // Populate bot properties with config data
    this.name = this.config.name || 'dbox';
    this.admin = this.config.admin || [ 'reality' ];
    this.moduleNames = this.config.modules || [ 'ignore', 'admin', 'command', 'dice', 'js', 'kick', 'puns', 'quotes', 'spelling', 'youare' ];
    this.language = this.config.language || 'english';
    this.webPort = this.config.webPort || 80;

    // It's the user's responsibility to fill this data structure up properly in
    // the config file. They can d-d-d-deal with it if they have problems.
    this.servers = this.config.servers || {
        'freenode': {
            'server': 'irc.freenode.net',
            'port': 6667,
            'nickserv': 'nickserv',
            'password': 'lolturtles',
            'channels': [
                '#realitest'
            ]
        }
    };

    // Create JSBot and connect to each server
    this.instance = jsbot.createJSBot(this.name);
    for(var name in this.servers) {
        if(this.servers.hasOwnProperty(name)) {
            var server = this.servers[name];
            this.instance.addConnection(name, server.server, server.port, this.admin, function(event) {
                var server = this.servers[event.server];
                for(var i=0;i<server.channels.length;i++) {
                    this.instance.join(event, server.channels[i]);
                }
            }.bind(this), server.nickserv, server.password);
        }
    }

    // Load the modules and connect to the server
    this.reloadModules();
    this.instance.connectAll();
};

// Say something in a channel
DBot.prototype.say = function(server, channel, message) {
    this.instance.say(server, channel, message);
};

// Format given stored string in config language
DBot.prototype.t = function(string, formatData) {
    var lang = this.language;
    if(!this.strings[string].hasOwnProperty(lang)) {
        lang = "english"; 
    }

    return this.strings[string][lang].format(formatData);
};

/*DBot.prototype.act = function(channel, data) {
    this.instance.send('PRIVMSG', channel, ':\001ACTION ' + data + '\001');
}*/

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
    this.commandMap = {}; // Map of which commands belong to which modules
    this.timers.clearTimers();
    this.save();

    // Enforce having command. it can still be reloaded, but dbot _will not_ 
    //  function without it, so not having it should be impossible
    if(!this.moduleNames.include("command")) {
        this.moduleNames.push("command");
    }

    // Reload Javascript snippets
    var path = require.resolve('./snippets');
    delete require.cache[path];
    require('./snippets');

    this.instance.removeListeners();

    this.moduleNames.each(function(name) {
        var cacheKey = require.resolve('./modules/' + name);
        delete require.cache[cacheKey];

        try {
            var rawModule = require('./modules/' + name);
            var module = rawModule.fetch(this);
            this.rawModules.push(rawModule);

            if(module.listener) {
                this.instance.addListener(module.on, module.name, module.listener);
            }

            if(module.onLoad) {
                module.onLoad();
            }

            if(module.commands) {
                var newCommands = module.commands;
                for(key in newCommands) {
                    if(newCommands.hasOwnProperty(key) && Object.prototype.isFunction(newCommands[key])) {
                        this.commands[key] = newCommands[key];
                        this.commandMap[key] = name;
                    }
                }
            }

            this.modules.push(module);
        } catch(err) {
            console.log(this.t('module_load_error', {'moduleName': name}));
            console.log(err);
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
