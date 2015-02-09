var databank = require('databank'),
    Databank = databank.Databank,
    DatabankObject = databank.DatabankObject,
    _ = require('underscore')._;

/**
 * Multiplex databank objects
 */
var DatabaseDriver = function(config) {
    this.config = config;
    this.databank = null;
};

/**
 * Connect to or create a new DataBank
 */
DatabaseDriver.prototype.createDB = function(name, driver, schema, callback) {
        var params = { 'schema': schema };

        if(driver == 'redis' && _.has(this.config, 'redisPort')) params.port = this.config.redisPort;
        if(driver == 'disk') params.dir = 'db';

        this.databank = Databank.get(driver, params);
        this.databank.connect({}, function(err) {
            if(err) {
                console.log('Didn\'t manage to connect to the data source - ' + err);
            } else {
                callback(this.databank);
            }
        }.bind(this));
};

exports.DatabaseDriver = DatabaseDriver;
