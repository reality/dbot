/**
 * Module Name: imgur
 * Description: Various imgur functionality
 */

var _ = require('underscore')._,
    request = require('request');

var imgur = function(dbot) {
    this.api = { 
        'getRandomImage': function(callback) {
            var testUrl = 'http://i.imgur.com/' + 
                Math.random().toString(36).substr(2,6) +
                '.jpg';
            var image = request(testUrl, function(error, response, body) {
                // 492 is body.length of a removed image
                if(!error && response.statusCode == 200 && body.length != 492) {
                    callback(testUrl);
                } else {
                    this.api.getRandomImage(callback);
                }
            }.bind(this)); 
        }
    };

    this.commands = {
        '~randomimgur': function(event) {
            this.api.getRandomImage(function(link) {
                event.reply(event.user + ': ' + link);
            });
        }
    }
};

exports.fetch = function(dbot) {
    return new imgur(dbot);
}
