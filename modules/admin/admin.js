/**
 * Module Name: Admin
 * Description: Set of commands which only one who is a DepressionBot
 * administrator can run - as such, it has its own command execution listener.
 */
var fs = require('fs'),
    _ = require('underscore')._;

var admin = function(dbot) {
    this.internalAPI = {
        'getCurrentConfig': function(configKey, callback) {
            var configPath = dbot.config;
            configKey = configKey.split('.');  

            for(var i=0;i<configKey.length;i++) {
                if(_.has(configPath, configKey[i])) {
                    configPath = configPath[configKey[i]]; 
                } else {
                    configPath = null;
                    break;
                }
            }

            callback(configPath);
        }
    };
};

exports.fetch = function(dbot) {
    return new admin(dbot);
};
