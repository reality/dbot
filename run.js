var fs = require('fs');
var timers = require('./timer');
var jsbot = require('./jsbot/jsbot');
require('./snippets');

var DBot = function(timers) {
    // Load external files
    this.config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
    this.db = null;
    var rawDB;
    try {
        var rawDB = fs.readFileSync('db.json', 'utf-8');
    } catch(err) {
        this.db = {};  // If no db file, make empty one
    }

    try {
        if(!this.db) {  // If it wasn't empty 
            this.db = JSON.parse(rawDB);
        }
    } catch(err) {
        console.log('Probably a syntax error in db.json: ' + err);
        this.db = {};
    }

    // Load Strings file
    try {
        this.strings = JSON.parse(fs.readFileSync('strings.json', 'utf-8'));
    } catch(err) {
        console.log('Probably a syntax error: ' + err);
        this.strings = {};
    }

    // Initialise run-time resources
    this.usage = {};
    this.sessionData = {};
    this.timers = timers.create();

    // Populate bot properties with config data
    this.name = this.config.name || 'dbox';
    this.admin = this.config.admin || [ 'reality' ];
    this.moduleNames = this.config.modules || [ 'ignore', 'admin', 'command', 'dice', 'js', 'kick', 'puns', 'quotes', 'spelling', 'youare' ];
    this.language = this.config.language || 'english';
    this.webHost = this.config.webHost || 'localhost';
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
    var formattedString;
    if(this.strings.hasOwnProperty(string)) {
        var lang = this.language;
        if(!this.strings[string].hasOwnProperty(lang)) {
            lang = "english"; 
        }

        formattedString = this.strings[string][lang].format(formatData);
    } else {
        formattedString = 'String not found. Something has gone screwy. Maybe.';
    }
    
    return formattedString;
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
    this.usage = {};
    this.timers.clearTimers();
    this.save();

    try {
        this.strings = JSON.parse(fs.readFileSync('strings.json', 'utf-8'));
    } catch(err) {
        this.strings = {};
    }

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
        var moduleDir = './modules/' + name + '/';
        var cacheKey = require.resolve(moduleDir + name);
        delete require.cache[cacheKey];

        try {
            // Load the module itself
            var rawModule = require(moduleDir + name);
            var module = rawModule.fetch(this);
            this.rawModules.push(rawModule);

            if(module.listener) {
                this.instance.addListener(module.on, module.name, module.listener);
            }

            if(module.onLoad) {
                module.onLoad();
            }

            // Load module commands
            if(module.commands) {
                var newCommands = module.commands;
                for(key in newCommands) {
                    if(newCommands.hasOwnProperty(key) && Object.prototype.isFunction(newCommands[key])) {
                        this.commands[key] = newCommands[key];
                        this.commandMap[key] = name;
                    }
                }
            }

            // Load the module usage data
            try {
                var usage = JSON.parse(fs.readFileSync(moduleDir + 'usage.json', 'utf-8'));
                for(key in usage) {
                    if(usage.hasOwnProperty(key)) {
                        if(this.usage.hasOwnProperty(key)) {
                            console.log('Usage key clash for ' + key + ' in ' + name);
                        } else {
                            this.usage[key] = usage[key];
                        }
                    }
                }
            } catch(err) {
                // Invalid or no usage info
            }

            // Load the module string data
            try {
                var strings = JSON.parse(fs.readFileSync(moduleDir + 'strings.json', 'utf-8'));
                for(key in strings) {
                    if(strings.hasOwnProperty(key)) {
                        if(this.strings.hasOwnProperty(key)) {
                            console.log('Strings key clash for ' + key + ' in ' + name);
                        } else {
                            this.strings[key] = strings[key];
                        }
                    }
                }
            } catch(err) {
                // Invalid or no string info
            }

            // Load the module config data
            try {
                var config = JSON.parse(fs.readFileSync(moduleDir + 'config.json', 'utf-8'))
                this.config[name] = config;
                for(var i=0;i<config.dbKeys;i++) {
                    if(!this.db.hasOwnProperty(config.dbKeys[i])) {
                        this.db[config.dbKeys[i]] = {};
                    }
                }
            } catch(err) {
                // Invalid or no config data
            }

            this.modules.push(module);
        } catch(err) {
            console.log(this.t('module_load_error', {'moduleName': name}));
            console.log('MODULE ERROR: ' + name + ' ' + err);
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
