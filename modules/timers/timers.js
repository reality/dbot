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
        'addTimer': function(timeout, callback, firstDate) {
            var now = new Date().getTime();
            if(firstDate) {
                console.log('Setting first timer to run at ' + firstDate);
                firstTimeout = firstDate.getTime() - now; 
                this.runningTimeouts.push(setTimeout(function() {
                    console.log('Running first timer at ' + new Date().toUTCString()); 
                    this.runningIntervals.push(this.api.addTimer(timeout, callback));
                    try {
                        callback();
                    } catch(err) {
                        console.log('Callback failed: ' + err);
                    }
                }.bind(this), firstTimeout));
            } else {
                this.runningIntervals.push(setInterval(function() {
                    console.log('Running subsequent timer at ' + new Date().toUTCString()); 
                    try {
                        callback();
                    } catch(err) {
                        console.log('Callback failed: ' + err);
                    }
                }.bind(this), timeout));
            }
        },

        'addTimeout': function(date, callback, params) {
            var now = new Date().getTime(),
                timeout = date.getTime() - now;
            this.runningTimeouts.push(setTimeout(function() {
                try {
                    callback.apply(callback, params);
                } catch(err) {
                    console.log('Callback failed: ' + err);
                }
            }, timeout));
        }
    };

    this.onDestroy = function() { 
        for(var i=0;i<this.runningTimeouts.length;i++) {
            console.log('destroying ' +this.runningTimeouts[i]);
            clearTimeout(this.runningTimeouts[i]); 
        }
        for(i=0;i<this.runningIntervals.length;i++) {
            console.log('destroying ' +this.runningIntervals[i]);
            clearInterval(this.runningIntervals[i]); 
        }
    }.bind(this);
};

exports.fetch = function(dbot) {
    return new timers(dbot);
};
