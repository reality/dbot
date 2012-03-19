var timers = function() {
    var timers = [];
    var timeouts = [];
    
    return {
        'addTimer': function(interval, callback) { // Because who puts the callback first. Really.
            timers.push(setInterval(callback, interval)); 
        },
        
        'addOnceTimer': function(delay, callback) { // Because who seriously puts the callback first here too?
            timeouts.push(setTimeout(callback, delay));
        },

        'clearTimers': function() {
            for(var i;i<timers.length;i++) {
                clearInterval(timers[i]);
            }
            for(var i;i<timeouts.length;i++) {
                clearTimeout(timeouts[i]);
            }
        }
    };
};

exports.create = function() {
    return timers();
}
