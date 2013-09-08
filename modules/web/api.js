var api = function(dbot) {
    return {
        'getUrl': function(path) {
            if(path.charAt(0) == '/') path = path.substr(1);
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
                mConfig = dbot.config.modules[module];

            if(mConfig.requireWebLogin == true) {
                if(req.isAuthenticated()) {
                    var accessNeeded = 'regular';
                    if(_.has(mConfig, 'pageAccess') && _.has(mConfig.pageAccess, path)) {
                        accessNeeded = mConfig.pageAccess[path];
                    } else if(!_.isUndefined(mConfig.webAccess)) {
                        accessNeeded = mConfig.webAccess; 
                    }

                    if(accessNeeded != 'regular') {
                        var allowedUsers = dbot.config.admins;
                        if(mConfig.webAccess == 'moderators') {
                            allowedUsers = _.union(allowedUsers, dbot.config.moderators);
                        }
                        if(mConfig.webAccess == 'power_users') {
                            allowedUsers = _.union(allowedUsers, dbot.config.moderators);
                            allowedUsers = _.union(allowedUsers, dbot.config.power_users);
                        }

                        if(_.include(allowedUsers, req.user.primaryNick)) {
                            return next();
                        } else {
                            res.redirect('/');
                        }
                    } else {
                        return next();
                    }
                } else {
                    res.render('login', {
                        'message': 'You need to log in to access this module.',
                        'redirect': req.originalUrl
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
