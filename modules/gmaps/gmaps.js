/**
 * Module Name: Google Maps
 * Description: GMaps and ting
 */
var gm = require('googlemaps'),
    _ = require('underscore')._;

var gmaps = function(dbot) {
    this.commands = {
        '~from': function(event) {
            var from = event.input[1],
                to = event.input[2],
                departureNow = Math.floor((new Date()).getTime()/1000);

            gm.directions(from, to, function(err, result) {
                if(!err && result && result.status !== 'ZERO_RESULTS') {
                    event.reply('If you leave right now, it will take ' + result.routes[0].legs[0].duration.text + ' to get from ' + from + ' to ' + to + ' via public transport.');
                } else {
                    event.reply('Apparently one cannot get from ' + from + ' to ' + to + ' using public transport. Do you accept the challenge?');
                }
            }, 'false', 'transit', null, null,null, null, null, departureNow);
        }
    };
    this.commands['~from'].regex = [/^from (.*) to (.*)/, 3];
};

exports.fetch = function(dbot) {
    return new gmaps(dbot);
};
