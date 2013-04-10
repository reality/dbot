var databank = require('databank'),
    Databank = databank.Databank,
    DatabankObject = databank.DatabankObject;

/**
 * Multiplex databank objects
 */
var DatabaseDriver = function() {
    this.databanks = {};
};

/**
 * Connect to or create a new DataBank
 */
DatabaseDriver.prototype.createDB = function(name, driver, schema, callback) {
    var params = { 'schema': schema };

    if(driver == 'disk') params.dir = 'db';

    this.databanks[name] = Databank.get(driver, params);
    this.databanks[name].connect({}, function(err) {
        if(err) {
            console.log('Didn\'t manage to connect to the data source - ' + err);
        } else {
            callback(this.databanks[name]);
        }
    }.bind(this));
};

exports.DatabaseDriver = DatabaseDriver;
