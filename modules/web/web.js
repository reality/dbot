var express = require('express'),
    fs = require('fs');

var webInterface = function(dbot) {
    var pub = 'public';
    var app = express();

    app.use(express.static(pub));
    app.set('view engine', 'jade');

    app.get('/', function(req, res) {
        res.render('index', { 'name': dbot.config.name });
    });

    
    app.listen(dbot.config.web.webPort);

    var reloadPages = function(pages) {
        for(var p in pages) {
            if( pages.hasOwnProperty(p) ) {
                var func = pages[p];
                var mod = func.module;
                app.get(p, (function(req, resp) {
                    // Crazy shim to seperate module views.
                    var shim = Object.create(resp);
                    shim.render = (function(view, one, two) {
                        // Render with express.js
                        resp.render(this.module.name + '/' + view, one, two);
                    }).bind(this);
                    shim.render_core = resp.render;
                    this.call(this.module, req, shim);
                }).bind(func));
            }
        }
    };

    return { 
        'name': 'web',
        'ignorable': false,
        'reloadPages': reloadPages,

        'onDestroy': function() {
            app.close();
        }
    };
};

exports.fetch = function(dbot) {
    return webInterface(dbot);
};
