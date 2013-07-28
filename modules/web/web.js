var express = require('express'),
    passport = require('passport'),
    passHash = require('password-hash'),
    flash = require('connect-flash'),
    _ = require('underscore')._,
    fs = require('fs'),
    LocalStrategy = require('passport-local').Strategy;

var webInterface = function(dbot) {
    this.config = dbot.config.modules.web;
    this.pub = 'public';
    this.app = express();

    this.app.use(express.static(this.pub));
    this.app.set('view engine', 'jade');
    this.app.use(express.cookieParser());
    this.app.use(express.bodyParser());
    this.app.use(express.methodOverride());
    this.app.use(express.session({ 'secret': 'wat' }));
    this.app.use(flash());

    this.app.use(passport.initialize());
    this.app.use(passport.session());
    this.app.use(this.app.router);

    passport.serializeUser(function(user, done) {
        done(null, user);
    });

    passport.deserializeUser(function(obj, done) {
        done(null, obj);
    });

    passport.use(new LocalStrategy(function(username, password, callback) {
        var splitUser = username.split('@'),
            server = splitUser[1],
            username = splitUser[0];

        dbot.api.users.resolveUser(server, username, function(user) {
            if(user) {
                this.api.getWebUser(user.id, function(webUser) {
                    if(webUser) {
                        if(passHash.verify(password, webUser.password)) {
                            return callback(null, user); 
                        } else {
                            return callback(null, false, { 'message': 'Incorrect password.' });
                        }
                    } else {
                        return callback(null, false, { 'message': 'Use ~setwebpass to set up your account for web login.' });
                    }
                });
            } else {
                return callback(null, false, { 'message': 'Unknown user' });
            }
        }.bind(this)); 
    }.bind(this)));

    var server = this.app.listen(this.config.webPort);

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

        this.app.get('/', function(req, res) {
            res.render('index', { 
                'name': dbot.config.name,
                'routes': indexModules
            });
        });

        this.app.get('/login', function(req, res) {
            res.render('login', {
                'user': req.user,
                'message': req.flash('error')
            });
        });

        this.app.post('/login', passport.authenticate('local', {
            'failureRedirect': '/login', 
            'failureFlash': true
        }), function(req, res) {
            res.render('login', {
                'user': req.user,
                'message': 'Successfully logged in!'
            });
        });

        this.app.get('/logout', function(req, res) {
            req.logout(); 
            res.redirect('/');
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
        },

        'getWebUser': function(id, callback) {
            this.db.read('web_users', id, function(err, webUser) {
                callback(webUser);
            }); 
        }
    };

    this.commands = {
        '~setwebpass': function(event) {
            var newPass = event.input[1];
            console.log(newPass);
            this.api.getWebUser(event.rUser.id, function(webUser) {
                if(!webUser) {
                    webUser = {
                        'id': event.rUser.id,
                        'password': false
                    }
                } 
                webUser.password = passHash.generate(newPass);

                this.db.save('web_users', webUser.id, webUser, function(result) {
                    event.reply(dbot.t('web_pass_set')); 
                });
            }.bind(this));
        }
    };
    this.commands['~setwebpass'].regex = [/^~setwebpass ([^ ]+)$/, 2]
};

exports.fetch = function(dbot) {
    return new webInterface(dbot);
};
