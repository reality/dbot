var express = require('express'),
    _ = require('underscore')._,
    fs = require('fs');

var webInterface = function(dbot) {
    this.pub = 'public';
    this.app = express();

    this.app.use(express.static(this.pub));
    this.app.set('view engine', 'jade');
   
    var server = this.app.listen(dbot.config.web.webPort);

    this.reloadPages = function() {
        var pages = dbot.pages;
        for(var p in pages) {
            if(_.has(pages, p)) {
                var func = pages[p];
                var mod = func.module;
                this.app.get(p, (function(req, resp) {
                    // Crazy shim to seperate module views.
                    var shim = Object.create(resp);
                    shim.render = (function(view, one, two) {
                        // Render with express.js
                        resp.render(this.module + '/' + view, one, two);
                    }).bind(this);
                    shim.render_core = resp.render;
                    this.call(this.module, req, shim);
                }).bind(func));
            }
        }
    }.bind(this);

    this.onLoad = function() {
        var routes = _.pluck(dbot.modules.web.app.routes.get, 'path');
        var moduleNames = _.keys(dbot.modules);
        var indexModules = [];

        _.each(moduleNames, function(moduleName) {
            var modulePath = '/' + moduleName;
            if(_.include(routes, modulePath)) {
                indexModules.push(moduleName);
            }
        });

        console.log(indexModules);

        // TODO: get list of loaded modules
        this.app.get('/', function(req, res) {
            res.render('index', { 
                'name': dbot.config.name,
                'routes': indexModules
            });
        });
    }.bind(this);

    this.onDestroy = function() {
        server.close();
    };

    this.api = {
        'getUrl': function(path) {
            if(path.charAt(0) == '/') path = path.substr(1);
            if(this.config.externalPath) {
                return this.config.externalPath + '/' + path;
            } else {
                return 'http://' + this.config.webHost + ':' + this.config.webPort + '/' + path;
            }
        }
    };
};

exports.fetch = function(dbot) {
    return new webInterface(dbot);
};
