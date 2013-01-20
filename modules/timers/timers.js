/**
 * Module Name: Timers
 * Description: Persistent timers and shit
 */
var _ = require('underscore')._;

var timers = function(dbot) {
    this.timers = dbot.db.timers;
    this.runningTimeouts = [];
    this.runningIntervals = [];

    this.api = {
        'addTimer': function(callback, timeout, firstDate) {
            var now = new Date().getTime();
            if(firstDate) {
                console.log('Setting first timer to run at ' + firstDate);
                firstTimeout = firstDate.getTime() - now; 
                setTimeout(function(callback) {
                    console.log('Running first timer at ' + new Date().toUTCString()); 
                    this.runningIntervals.push(this.api.addTimer(callback, timeout));
                    callback();
                }.bind(this), firstTimeout);
            } else {
                this.runningIntervals.push(setInterval(function(callback) {
                    console.log('Running subsequent timer at ' + new Date().toUTCString()); 
                    callback();
                }.bind(this), timeout));
            }
        }
    };

    this.onDestroy = function() { 
        for(var i=0;i<this.runningTimeouts;i++) {
            clearTimeout(this.runningTimeouts[i]); 
        }
        for(i=0;i<this.runningIntervals;i++) {
            clearTimer(this.runningIntervals[i]); 
        }
    }.bind(this);
};

exports.fetch = function(dbot) {
    return new timers(dbot);
};
