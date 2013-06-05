/**
 * Module Name: Admin
 * Description: Set of commands which only one who is a DepressionBot
 * administrator can run.
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
        },

        'setConfig': function(configKey, newOption, callback) {
            var configPath = dbot.customConfig,
                oldOption = null;
            configKey = configKey.split('.');

            for(var i=0;i<configKey.length-1;i++) {
                if(!_.has(configPath, configKey[i])) {
                    configPath[configKey[i]] = {};
                }
                configPath = configPath[configKey[i]];
            }

            if(_.has(configPath, configKey[i])) {
                oldOption = configPath[configKey[i]];
            }
            configPath[configKey[i]] = newOption;
            
            this.internalAPI.saveConfig();
            dbot.reloadModules();
            callback(null, oldOption);
        }.bind(this),

        'saveConfig': function() {
            var config = dbot.customConfig;
            fs.writeFileSync('config.json', JSON.stringify(config, null, '    '));
        }
    };
};

exports.fetch = function(dbot) {
    return new admin(dbot);
};
