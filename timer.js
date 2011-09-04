var timers = function() {
    var timers = [];
    
    return {
        'addTimer': function(interval, callback) { // Because who puts the callback first. Really.
            timers.push(setInterval(callback, interval)); 
        },

        'clearTimers': function() {
            for(var i;i<timers.length;i++) {
                clearInterval(timers[i]);
            }
        }
    };
};

exports.create = function() {
    return timers();
}
