var fs = require('fs');
var timers = require('./timer');
var jsbot = require('./jsbot/jsbot');
require('./snippets');

var DBot = function(timers) {
    // Load external files
    var requiredConfigKeys = [ 'name', 'servers', 'admins', 'moduleNames', 'language', 'debugMode' ];
    try {
        this.config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
    } catch(err) {
        console.log('Config file is screwed up. Attempting to load defaults.');
        try {
            this.config = JSON.parse(fs.readFileSync('config.json.sample', 'utf-8'));
        } catch(err) {
            console.log('Error loading sample config. Bugger off. Stopping.');
            process.exit();
        }
    }
    requiredConfigKeys.each(function(key) {
        if(!this.config.hasOwnProperty(key)) {
            console.log('Error: Please set a value for ' + key + ' in ' +
                'config.json. Stopping.');
            process.exit();
        }
    }.bind(this));

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
        console.log('Syntax error in db.json. Stopping: ' + err);
        process.exit();
    }

    // Load Strings file
    try {
        this.strings = JSON.parse(fs.readFileSync('strings.json', 'utf-8'));
    } catch(err) {
        console.log('Probably a syntax error in strings.json: ' + err);
        this.strings = {};
    }

    // Initialise run-time resources
    this.usage = {};
    this.sessionData = {};
    this.timers = timers.create();

    // Populate bot properties with config data
    // Create JSBot and connect to each server
    this.instance = jsbot.createJSBot(this.config.name);
    for(var name in this.config.servers) {
        if(this.config.servers.hasOwnProperty(name)) {
            var server = this.config.servers[name];
            this.instance.addConnection(name, server.server, server.port,
                    this.config.admin, function(event) {
                var server = this.config.servers[event.server];
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
        var lang = this.config.language;
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
    this.pages = {};
    this.modules = {};
    this.commands = {};
    this.api = {};
    this.commandMap = {}; // Map of which commands belong to which modules
    this.usage = {};
    this.timers.clearTimers();

    try {
        this.strings = JSON.parse(fs.readFileSync('strings.json', 'utf-8'));
    } catch(err) {
        this.strings = {};
    }

    var moduleNames = this.config.moduleNames;

    // Enforce having command. it can still be reloaded, but dbot _will not_ 
    //  function without it, so not having it should be impossible
    if(!moduleNames.include("command")) {
        moduleNames.push("command");
    }

    // Reload Javascript snippets
    var path = require.resolve('./snippets');
    delete require.cache[path];
    require('./snippets');

    this.instance.removeListeners();

    moduleNames.each(function(name) {
        var moduleDir = './modules/' + name + '/';
        var cacheKey = require.resolve(moduleDir + name);
        delete require.cache[cacheKey];

        try {
            var webKey = require.resolve(moduleDir + 'web');
        } catch(err) {
        }
        if(webKey) {
            delete require.cache[webKey];
        }

        try {
            // Load the module config data
            try {
                var config = JSON.parse(fs.readFileSync(moduleDir + 'config.json', 'utf-8'))
                this.config[name] = config;
                for(var i=0;i<config.dbKeys.length;i++) {
                    if(!this.db.hasOwnProperty(config.dbKeys[i])) {
                        this.db[config.dbKeys[i]] = {};
                    }
                }
            } catch(err) {
                // Invalid or no config data
            }

            // Load the module itself
            var rawModule = require(moduleDir + name);
            var module = rawModule.fetch(this);
            this.rawModules.push(rawModule);

            module.name = name;

            if(module.listener) {
                var listenOn = module.on;
                if(!(listenOn instanceof Array)) {
                    listenOn = [listenOn];
                }

                listenOn.each(function(on) {
                    this.instance.addListener(on, module.name, module.listener);
                }.bind(this));
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

            // Load module web bits
            if(module.pages) {
                var newpages = module.pages;
                for(var key in newpages)
                {
                    if(newpages.hasOwnProperty(key) && Object.prototype.isFunction(newpages[key])) {
                        this.pages[key] = newpages[key];
                        this.pages[key].module = module;
                    }
                }
            }

            // Load module API
            if(module.api) {
                this.api[module.name] = module.api;
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

            module.toString = function() {
                return this.name;
            }
            this.modules[module.name] = module;
        } catch(err) {
            console.log(this.t('module_load_error', {'moduleName': name}));
            if(this.config.debugMode) {
                console.log('MODULE ERROR (' + name + '): ' + err.stack );
            }
            else {
                console.log('MODULE ERROR (' + name + '): ' + err );
            }
        }
    }.bind(this));
    this.reloadPages();
    this.save();
};

DBot.prototype.reloadPages = function() {
    for( var m in this.modules ) {
        if( Object.prototype.isFunction(this.modules[m].reloadPages)) {
            this.modules[m].reloadPages(this.pages);
        }
    }
}

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
