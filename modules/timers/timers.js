/**
 * Module Name: Timers
 * Description: Persistent timers and shit
 */
var _ = require('underscore')._;

var timers = function(dbot) {
    this.timers = dbot.db.timers;
    this.runningTimers = [];

    this.api = {
        'addTimer': function(callback, timeout, firstDate) {
            var now = new Date().getTime();
            if(firstDate) {
                console.log('Setting first timer to run at ' + firstDate);
                timeout = firstDate.getTime() - now; 
                setTimeout(function(callback) {
                    console.log('Running first timer at ' + new Date().toUTCString()); 
                    callback();
                    this.api.addTimer(callback, timeout);
                }.bind(this), timeout);
            } else {
                setInterval(function(callback) {
                    console.log('Running subsequent timer at ' + new Date().toUTCString()); 
                    callback();
                }.bind(this), timeout);
            }
        }
    };

    this.onLoad = function() { 
        // TODO: Persist timers
    }.bind(this);
};

exports.fetch = function(dbot) {
    return new timers(dbot);
};
