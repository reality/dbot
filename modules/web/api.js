var _ = require('underscore')._;

var api = function(dbot) {
    return {
        'getUrl': function(path) {
            if(path.charAt(0) == '/') path = path.substr(1);
            path = encodeURI(path);
            if(this.config.externalPath) {
                return this.config.externalPath + '/' + path;
            } else {
                return 'http://' + this.config.webHost + ':' + this.config.webPort + '/' + path;
            }
        },

        'addIndexLink': function(route, title) {
            this.indexLinks[route] = title;
        },

        'getWebUser': function(id, callback) {
            this.db.read('web_users', id, function(err, webUser) {
                callback(webUser);
            }); 
        },

        'hasAccess': function(req, res, next) {
            var path = req.route.path,
                module = dbot.pages[path].module,
                mConfig = dbot.config.modules[module],
                accessNeeded,
                allowedNicks;

            if(mConfig.requireWebLogin == true) {
                if(req.isAuthenticated()) {
                    if(_.has(mConfig, 'pageAccess') && _.has(mConfig.pageAccess, path)) {
                        accessNeeded = mConfig.pageAccess[path];
                    } else if(!_.isUndefined(mConfig.webAccess)) {
                        accessNeeded = mConfig.webAccess; 
                    }

                    if(!_.isUndefined(accessNeeded) || accessNeeded == null) {
                        return next();
                    }

                    if(!_.isFunction(accessNeeded)) {
                        if(_.has(dbot.access, accessNeeded)) {
                            accessNeeded = dbot.access[accessNeeded];
                        } else {
                            return next();
                        }
                    }

                    if(_.include(accessNeeded(), req.user.primaryNick)) {
                        return next();
                    } else {
                        res.redirect('/');
                    }
                } else {
                    res.render('login', {
                        'message': 'You need to log in to access this module.',
                        'redirect': req.originalUrl,
			'routes': dbot.modules.web.indexLinks
                    });
                }
            } else {
                return next();
            }
        }
    };
};

exports.fetch = function(dbot) {
    return api(dbot);
};
