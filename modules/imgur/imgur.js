/**
 * Module Name: imgur
 * Description: Various imgur functionality
 */

var _ = require('underscore')._,
    request = require('request');

var imgur = function(dbot) {
    this.api = { 
        'getRandomImage': function(callback) {
            var random = function(len) {
                var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
                return len ? chars.charAt(~~(Math.random()*chars.length)) + random(len-1) : "";
            };
            
            var ext = [ 'gif', 'png', 'jpg' ];
            var testSlug = random(5);
            var testUrl = 'http://i.imgur.com/' + 
                testSlug +
                '.' + ext[_.random(0, ext.length - 1)];
            var image = request(testUrl, function(error, response, body) {
                // 492 is body.length of a removed image
                if(!error && response.statusCode == 200 && body.length != 492) {
                    callback(testUrl, testSlug);
                } else {
                    this.api.getRandomImage(callback);
                }
            }.bind(this)); 
        },

        'getImageInfo': function(slug, callback) {
            request.get({
                'url': 'https://api.imgur.com/3/image/' + slug + '.json',
                'json': true,
                'headers': {
                    'Authorization': 'Client-ID 86fd3a8da348b65'
                }
            }, function(err, response, body) {
                callback(body);
            });
        }
    };

    this.commands = {
        '~ri': function(event) {
            this.api.getRandomImage(function(link, slug) {
                this.api.getImageInfo(slug, function(imgData) {
                    imgData = imgData.data;
                    var info = '[';
                    if(imgData.title) {
                        info += imgData.title + ' is ';
                    } else {
                        info += 'no-title is ';
                    }
                    if(imgData.animated) {
                        info += 'an animated ' + imgData.type.split('/')[1] + ' with ';
                    } else {
                        info += 'a non-animated ' + imgData.type.split('/')[1] + ' with ';
                    }
                    info += imgData.views + ' views.]';

                    event.reply(event.user + ': ' + link + ' ' + info);
                });
                
            }.bind(this));
        }
    }

    this.onLoad = function() {
    }.bind(this);
};

exports.fetch = function(dbot) {
    return new imgur(dbot);
}
