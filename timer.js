var timers = function() {
    var timers = [];
    var timeouts = [];
    
    return {
        'addTimer': function(interval, callback) { // Because who puts the callback first. Really.
            var timer = setInterval(callback, interval);
            timers.push(timer); 
            return timer;
        },
        
        'addOnceTimer': function(delay, callback) { // Because who seriously puts the callback first here too?
            var timeout = setTimeout(callback, delay);
            timeouts.push(timeout);
            return timeout;
        },

        'clearTimers': function() {
            for(var i;i<timers.length;i++) {
                clearInterval(timers[i]);
            }
            for(var i;i<timeouts.length;i++) {
                clearTimeout(timeouts[i]);
            }
        },

        'clearTimer': function(id) {
            clearTimer(id);
        }, 

        'clearTimeout': function(id) {
            clearTimeout(id);
        }
    };
};

exports.create = function() {
    return timers();
}
