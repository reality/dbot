var express = require('express'),
    _ = require('underscore')._,
    fs = require('fs');

var webInterface = function(dbot) {
    var pub = 'public';
    var app = express();

    app.use(express.static(pub));
    app.set('view engine', 'jade');

    app.get('/', function(req, res) {
        res.render('index', { 'name': dbot.config.name });
    });
   
    var server = app.listen(dbot.config.web.webPort);

    this.reloadPages = function() {
        var pages = dbot.pages;
        for(var p in pages) {
            if(_.has(pages, p)) {
                var func = pages[p];
                var mod = func.module;
                app.get(p, (function(req, resp) {
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

    this.onDestroy = function() {
        server.close();
    };

    this.api = {
        'getUrl': function(path) {
            if(this.config.externalPath) {
                return this.config.externalPath + '/' + path;
            } else {
                return 'http://' + this.config.webHost + ':' + port + '/' + path;
            }
        }
    };
};

exports.fetch = function(dbot) {
    return new webInterface(dbot);
};
