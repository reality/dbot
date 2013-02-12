var databank = require('databank'),
    Databank = databank.Databank,
    DatabankObject = databank.DatabankObject;
    //DatabankStore = require('connect-databank')(express);

/**
 * Multiplex databank objects
 */
var DatabaseDriver = function() {
    this.databanks = {};
};

/**
 * Connect to or create a new DataBank
 */
DatabaseDriver.prototype.createDB = function(name, driver, callback, schema) {
    var params = { 'schema': schema };
    this.databanks[name] = Databank.get(driver, params);
    this.databanks[name].connect({}, function(err) {
        if(err) {
            console.log('Didn\'t manage to connect to the data source.');
        } else {
            callback(this.databanks[name]);
        }
    }.bind(this));
};

exports.DatabaseDriver = DatabaseDriver;
