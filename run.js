var fs = require('fs'),
    _ = require('underscore')._,
    timers = require('./timer'),
    jsbot = require('./jsbot/jsbot');
require('./snippets');

var DBot = function(timers) {
    // Load config
    try {
        this.config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
    } catch(err) {
        console.log('Config file is invalid. Stopping');
        process.exit();
    }

    try {
        var defaultConfig = JSON.parse(fs.readFileSync('config.json.sample', 'utf-8'));
    } catch(err) {
        console.log('Error loading sample config. Bugger off this should not even be edited. Stopping.');
        process.exit();
    }

    // Load missing config directives from sample file
    _.defaults(this.config, defaultConfig);

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
        if(_.has(this.config.servers, name)) {
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
            var config = {};
            try {
                config = JSON.parse(fs.readFileSync(moduleDir + 'config.json', 'utf-8'))
                
            } catch(err) {
                // Invalid or no config data
            }

            this.config[name] = config;
            _.each(config.dbKeys, function(dbKey) {
                if(!_.has(this.db, dbKey)) {
                    this.db[dbKey] = {};
                }
            }, this);

            // Load the module itself
            var rawModule = require(moduleDir + name);
            var module = rawModule.fetch(this);
            this.rawModules.push(rawModule);

            module.name = name;

            if(module.listener) {
                if(!_.isArray(module.on)) {
                    module.on = [ module.on ];
                }

                _.each(module.on, function(on) {
                    this.instance.addListener(on, module.name, module.listener);
                }, this);
            }

            if(module.onLoad) {
                module.onLoad();
            }

            // Load module commands
            if(module.commands) {
                _.extend(this.commands, module.commands);
                _.each(module.commands, function(command, commandName) {
                    command.module = name;
                    if(_.has(config, 'commands') && _.has(config.commands, commandName)) {
                        _.extend(command, config.commands[commandName]);
                    }
                }, this);
            }

            // Load module web bits
            if(module.pages) {
                _.extend(this.pages, module.pages);
                _.each(module.pages, function(page) {
                    page.module = name; 
                }, this);
            }

            // Load module API
            if(module.api) {
                this.api[module.name] = module.api;
            }

            // Load the module usage data
            var usage = {};
            try {
                usage = JSON.parse(fs.readFileSync(moduleDir + 'usage.json', 'utf-8'));
            } catch(err) {
                // Invalid or no usage info
            }
            _.extend(this.usage, usage);

            // Load the module string data
            var strings = {};
            try {
                strings = JSON.parse(fs.readFileSync(moduleDir + 'strings.json', 'utf-8'));
            } catch(err) {
                // Invalid or no string info
            }
            _.extend(this.strings, strings);

            // Provide toString for module name
            module.toString = function() {
                return this.name;
            }

            this.modules[module.name] = module;
        } catch(err) {
            console.log(this.t('module_load_error', {'moduleName': name}));
            if(this.config.debugMode) {
                console.log('MODULE ERROR (' + name + '): ' + err.stack );
            } else {
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
