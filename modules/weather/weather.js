/**
 * Module Name: weather
 * Description: weather and ting
 */
var request = require('request'),
    _ = require('underscore')._;

var weather = function(dbot) {
    this.ApiRoot = 'http://api.openweathermap.org/data/2.5/';
    this.commands = {
        '~weather': function(event) {
            var city = event.input[1];

            request.get({
                'url': this.ApiRoot + 'weather',
                'qs': {
                    'q': city,
                    'units': 'metric'
                },
                'json': true
            }, function(err, response, body) {
                if(!err && body && _.has(body, 'cod') && body.cod === 200) {
                    event.reply('Weather in ' + city + ': Temp: ' + body.main.temp + 'C Condition: ' + body.weather[0].description);
                } else {
                    event.reply('There is no weather in ' + city);
                }
            });
        }
    };
    this.commands['~weather'].regex = [/^weather (.*)/, 2];
};

exports.fetch = function(dbot) {
    return new weather(dbot);
};
