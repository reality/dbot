/**
 * Module Name: event
 * Description: Allow other modules to emit events and that
 */
var _ = require('underscore')._;

var event = function(dbot) {
    this.dbot = dbot;
    this.hooks = {};
    this.api = {
        'addHook': function(eventName, callback) {
            if(!_.has(this.hooks, eventName)) this.hooks[eventName] = [];
            this.hooks[eventName].push(callback);
        },

        'emit': function(eventName, args) {
            if(_.has(this.hooks, eventName)) {
                _.each(this.hooks[eventName], function(callback) {
                    callback.apply(callback.module, args); 
                });
            }
        }
    };
}

exports.fetch = function(dbot) {
    return new event(dbot);
};
