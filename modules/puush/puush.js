/**
 * Module Name: puush
 * Description: You like the random puush?
 */

var _ = require('underscore')._,
    request = require('request'),
    async = require('async');

var puush = function(dbot) {
    this.ApiRoot = 'http://puu.sh/';
    this.rpCache = [];

    this.api = {
        'getRandomImage': function(callback) {
            var random = function(len) {
                var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
                return len ? chars.charAt(~~(Math.random()*chars.length)) + random(len-1) : "";
            };

            var ext = [ 'gif', 'png', 'jpg' ];
            var testSlug = random(5);
            var testUrl = 'http://puu.sh/' +
                testSlug +
                '.' + ext[_.random(0, ext.length - 1)];

            request(testUrl, function(error, response, body) {
                if(!error && response.statusCode === 200 && body.length > 500) {
                    callback(testUrl);
                } else {
                    this.api.getRandomImage(callback);
                }
            }.bind(this));
        }
    };

    this.commands = {
        '~rp': function(event) {
            var local = event.user;
            if(event.params[1]) {
                local = event.params.splice(1, event.params.length - 1).join(' ').trim();
            }

            if(this.rpCache.length > 0) {
                event.reply(local + ': ' + this.rpCache.pop());
                this.api.getRandomImage(function(url) {
                    this.rpCache.push(url);
                }.bind(this)); 
            } else {
                this.api.getRandomImage(function(url) {
                    event.reply(local + ': ' + url); 
                });        
            }
        }
    };

    this.onLoad = function() {
        async.times(10, function(n, next) {
            this.api.getRandomImage(function(url) {
                this.rpCache.push(url);
                next();
            }.bind(this));
        }.bind(this), function() {});
    }.bind(this);
};

exports.fetch = function(dbot) {
    return new puush(dbot);
};
