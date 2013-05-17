/**
 * Name: API
 * Description: Expose DBot API functionality with a REST API
 */
var _ = require('underscore')._;

var api = function(dbot) {
    this.onLoad = function() {
        dbot.modules.web.app.get('/api': function(req, res) {
            var externalApi = {};
            _.each(dbot.api, function(moduleApi, moduleName) {
                externalApi[moduleName] = {};
                _.each(moduleApi, function(method, methodName) { 
                    if(method.external == true) {
                        externalApi[moduleName][methodName] = method.extMap;
                    }
                });
            });

            res.render('api', { 'name': dbot.config.name, 'api': externalApi });
        });

        dbot.modules.web.app.get('/api/:module/:method', function(req, res) {
            var module = req.params.module,
                method = req.params.method,
                reqArgs = req.query,
                body = { 'err': null, 'data': null };

                if(!_.has(dbot.api, module)) {
                    body.err = 'No such API module';
                } else if(!_.has(dbot.api[module], method)) {
                    body.err = 'No such API function in ' + module;
                } else if(dbot.api[module][method].external !== true) {
                    body.err = 'API function ' + module + '.' + method + 
                        ' not enabled for external access';
                }
                
                if(!body.err) {
                    var func = dbot.api[module][method],
                        paramNames = func.extMap,
                        args = [];
                    
                    _.each(reqArgs, function(arg, name) {
                        var callbackIndex = paramNames.indexOf(name);
                        if(callbackIndex != -1) {
                            args[callbackIndex] = decodeURIComponent(arg);
                        }
                    });

                    var callbackIndex = paramNames.indexOf('callback');
                    if(callbackIndex != -1) {
                        args[callbackIndex] = function() {
                            body.data = Array.prototype.slice.call(arguments, 0);
                            res.json(body);
                        };
                        func.apply(null, args);
                    } else {
                        body.data = func.apply(null, args);
                        res.json(body);
                    }
                } else {
                    res.json(body);
                }
        }.bind(this));
    }.bind(this);
};

exports.fetch = function(dbot) {
    return new api(dbot);
};
