/**
 * Module Name: rome2rio
 * Description: Maps and ting
 */
var request = require('request'),
    _ = require('underscore')._;

var gmaps = function(dbot) {
    this.ApiRoot = 'http://free.rome2rio.com/api/1.2/json/';
    this.commands = {
        '~from': function(event) {
            var from = event.input[1],
                to = event.input[2];

            request.get({
                'url': this.ApiRoot + 'Search',
                'qs': {
                    'key': this.config.api_key,
                    'oName': from,
                    'dName': to,
                    'currencyCode': event.rProfile.currency || 'gbp'
                },
                'json': true
            }, function(err, response, body) {
                if(!err && body && _.has(body, 'routes') && _.has(body.routes[0], 'duration') && _.has(body.routes[0], 'indicativePrice')) {
                    var route = body.routes[0];
                    event.reply('If you left right now, it would take you ' + Math.floor(route.duration / 60) + ' hours and ' + 
                        (route.duration % 60) + ' minutes to get the ' + Math.floor(route.distance) + 'KM from ' + from + ' to ' + to + ', and cost you about ' + 
                        route.indicativePrice.price + route.indicativePrice.currency);
                } else {
                    event.reply('Apparently one cannot get from ' + from + ' to ' + to + ' using public transport. Do you accept the challenge?');
                }
            });
             
        }
    };
    this.commands['~from'].regex = [/^from (.*) to (.*)/, 3];
};

exports.fetch = function(dbot) {
    return new gmaps(dbot);
};
