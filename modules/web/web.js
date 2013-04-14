var express = require('express'),
    _ = require('underscore')._,
    fs = require('fs');

var webInterface = function(dbot) {
    this.pub = 'public';
    this.app = express();

    this.app.use(express.static(this.pub));
    this.app.set('view engine', 'jade');

    this.app.get('/', function(req, res) {
        res.render('index', { 'name': dbot.config.name });
    });
   
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

    this.onDestroy = function() {
        server.close();
    };

    this.api = {
        'getUrl': function(path) {
            console.log(path);
            if(this.config.externalPath) {
                console.log('external');
                return this.config.externalPath + '/' + path;
            } else {
                console.log('internal');
                return 'http://' + this.config.webHost + ':' + this.config.webPort + '/' + path;
            }
        }
    };
};

exports.fetch = function(dbot) {
    return new webInterface(dbot);
};
