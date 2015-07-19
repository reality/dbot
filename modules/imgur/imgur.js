/**
 * Module Name: imgur
 * Description: Various imgur functionality
 */

var _ = require('underscore')._,
    request = require('request'),
    async = require('async'),
    crypto = require('crypto'),
    humanise = require('humanize');

var imgur = function(dbot) {
    this.ApiRoot = 'https://api.imgur.com/3/';
    this.ExcludeRes = [
        { 'w': 800, 'h': 600 },
        { 'w': 1024, 'h': 768 },
        { 'w': 1280, 'h': 768 },
        { 'w': 1280, 'h': 960 },
        { 'w': 1366, 'h': 768 },
        { 'w': 1600, 'h': 900 },
        { 'w': 1680, 'h': 1050 },
        { 'w': 1920, 'h': 1080 },
        { 'w': 1024, 'h': 640 }
    ];
    this.riCache = [];

    this.internalAPI = {
        'infoString': function(imgData) {
            info = '';
            if(!_.isUndefined(imgData) && _.has(imgData, 'data') && !_.isUndefined(imgData.data.type)) {
                imgData = imgData.data;
                if(imgData.title) {
                    info += imgData.title + ' - ';
                }
                if(imgData.type) {
                    if(imgData.animated) {
                        info += 'an animated ' + imgData.type.split('/')[1] + ' with ';
                    } else {
                        info += 'a ' + imgData.type.split('/')[1] + ' with ';
                    }
                } else {
                    info += 'an image with ';
                }
                info += imgData.views + ' views (';
                info += imgData.width + 'x' + imgData.height + ')';
                
                info += ' ('+humanise.filesize(imgData.size)+')';
            }

            return info;
        }.bind(this),

        'albumInfoString': function(albumData) {
            var info = '';
            if(!_.isUndefined(albumData) && _.has(albumData, 'data') && !_.isUndefined(albumData.data.id)) {
                albumData = albumData.data;
                if(albumData.title) {
                    info += albumData.title + ' - ';
                }
                if(albumData.description) {
                    info += albumData.description.split('\n')[0] + ' is ';
                }
                info += 'an album with ' + albumData.images_count + ' images ';
                info += 'and ' + albumData.views + ' views';
                if(albumData.nsfw) {
                    info += ' - NSFW';
                }
            }
            return info;
        }.bind(this),

        'galleryInfoString': function(galData) {
            var info = '';
            if(!_.isUndefined(galData) && _.has(galData, 'data') && !_.isUndefined(galData.data.is_album)) {
                if(galData.data.is_album === true) {
                    info = this.internalAPI.albumInfoString(galData);
                } else {
                    info = this.internalAPI.infoString(galData);
                }
            }
            return info;
        }.bind(this)
    };

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
                '.' + ext[_.random(0, ext.length - 1)],
		fbman = false;
            dbot.db.imgur.totalHttpRequests += 1;

            request(testUrl, function(error, response, body) {
                // 492 is body.length of a removed image
                if(!error && response.statusCode == 200 && body.length != 492) {
                    dbot.db.imgur.totalImages += 1;
                    var hash = crypto.createHash('md5').update(body).digest("hex");
                    if(_.has(dbot.modules, 'quotes')){
                        // autoadd: {"abcdef": "facebookman"}
                        if(_.has(dbot.config.modules.imgur.autoadd,hash)){
				fbman = true;
                            var category = this.config.autoadd[hash];
                            if (_.contains(category, testUrl)){
                                // there's probably less than 62^5 chance of this happening
                            } else {
                                dbot.api.quotes.addQuote(category, testUrl,
                                    dbot.config.name, function() { });
                            }
                        }
                    }
                    callback(testUrl, testSlug, hash, fbman);
                } else {
                    this.api.getRandomImage(callback);
                }
            }.bind(this));
        },

        'getGoodRandomImage': function(callback) {
            this.api.getRandomImage(function(url, slug, hash, fbman) {
                this.api.getImageInfo(slug, function(imgData) {
                    if(!_.isUndefined(imgData) && 
                            imgData.data && 
                            imgData.data.height > 500 && imgData.data.width > 500 &&
                            !_.any(this.ExcludeRes, function(res) {
                                return imgData.data.height == res.h && imgData.data.width == res.w;
                            })) {
                        callback(url, imgData);
                    } else if(fbman === true) {
		    	callback(url, imgData);
		    } else {
                        this.api.getGoodRandomImage(callback);
                    }
                }.bind(this));
            }.bind(this));
        },

        'getImageInfoString': function(slug, callback) {
            this.api.getImageInfo(slug, function(imgData) {
                callback(this.internalAPI.infoString(imgData));
            }.bind(this));
        },

        'getImageInfo': function(slug, callback) {
            request.get({
                'url': 'https://api.imgur.com/3/image/' + slug + '.json',
                'json': true,
                'headers': {
                    'Authorization': 'Client-ID ' + this.config.apikey
                }
            }, function(err, response, body) {
                dbot.db.imgur.totalApiRequests += 1;
                callback(body);
            }.bind(this));
        },

        'getAlbumInfo': function(slug, callback) {
            request.get({
                'url': 'https://api.imgur.com/3/album/' + slug + '.json',
                'json': true,
                'headers': {
                    'Authorization': 'Client-ID ' + this.config.apikey
                }
            }, function(err, response, body) {
                this.db.totalApiRequests += 1;
                callback(body);
            }.bind(this));
        },

        'getGalleryInfo': function(slug, callback) {
            request.get({
                'url': 'https://api.imgur.com/3/gallery/' + slug + '.json',
                'json': true,
                'headers': {
                    'Authorization': 'Client-ID ' + this.config.apikey
                }
            }, function(err, response, body) {
                this.db.totalApiRequests += 1;
                callback(body);
            }.bind(this));
        }
    };
    this.api['getRandomImage'].external = true;
    this.api['getRandomImage'].extMap = [ 'callback' ];
    this.api['getImageInfoString'].external = true;
    this.api['getImageInfoString'].extMap = [ 'slug', 'callback' ];

    this.commands = {
        '~ri': function(event) {
            var local = event.user;
            if(event.params[1]) {
                local = event.params.splice(1, event.params.length - 1).join(' ').trim();
            }

            var postImage = function(link, imgData) {
                var info = this.internalAPI.infoString(imgData);
                event.reply('['+this.config.outputPrefix + '] ' + local + ': ' + link + ' [' + info + ']');
            }.bind(this);
            var newCacheImage = function(link, imgData) {
                this.riCache.push([link, imgData]);
            }.bind(this);
            var callback = postImage;

            if(this.riCache.length > 0) {
                var image = this.riCache.pop();
                postImage(image[0], image[1]);
                callback = newCacheImage;
            }

            this.api.getGoodRandomImage(callback);
        },

        // Legacy RI
        '~lri': function(event) {
            var local = event.user;
            if(event.params[1]) {
                local = event.params.splice(1, event.params.length - 1).join(' ').trim();
            }
            this.api.getRandomImage(function(link, slug) {
                this.api.getImageInfo(slug, function(imgData) {
                    var info = this.internalAPI.infoString(imgData);
                    event.reply('['+this.config.outputPrefix + '] ' + local + ': ' + link + ' [' + info + ']');
                }.bind(this));
            }.bind(this));
        },
        
        // Super RI
        '~sri': function(event) {
            var local = event.user;
            if(event.params[1]) {
                local = event.params.splice(1, event.params.length - 1).join(' ').trim();
            }
            request.get({
                'url': this.ApiRoot + 'gallery/random/random/',
                'json': true,
                'headers': {
                    'Authorization': 'Client-ID ' + this.config.apikey
                }
            }, function(err, response, body) {
                if(!_.isUndefined(body) && body.data && body.data[0] != undefined) {
                    var num = _.random(0, body.data.length - 1);
                    this.api.getGalleryInfo(body.data[num].id, function(gal) {
                        event.reply('['+this.config.outputPrefix + '] ' + local + ': ' + gal.data.link + ' [' + 
                            this.internalAPI.galleryInfoString(gal) + ']');
                    }.bind(this));
                }
            }.bind(this));
        },

        '~imgur': function(event) {
            var term = event.input[1]; 
            request.get({
                'url': this.ApiRoot + 'gallery/search/',
                'json': true,
                'headers': {
                    'Authorization': 'Client-ID ' + this.config.apikey
                },
                'qs': {
                    'q': term
                }
            }, function(err, response, body) {
                if(!_.isUndefined(body) && body.data && body.data[0] != undefined) {
                    var num = _.random(0, body.data.length - 1);
                    this.api.getGalleryInfo(body.data[num].id, function(gal) {
                        event.reply(dbot.t('imgurinfo',  { 
                            'info': this.internalAPI.galleryInfoString(gal)
                        }) + ' - ' + gal.data.link);
                    }.bind(this));
                } else {
                    event.reply(dbot.t('imgur_noresults'));
                }
            }.bind(this));
        }
    }
    this.commands['~imgur'].regex = [/^imgur ([\d\w\s-]*)/, 2];

    this.onLoad = function() {
        var imgurHandler = function(matches, name, callback) {
            if(matches[1]) {
                var dataCallback = function(data) {
                    var info;
                    if(name == 'imgurimage') { 
                        info = this.internalAPI.infoString(data);
                    } else if(name == 'imguralbum') {
                        info = this.internalAPI.albumInfoString(data);
                    } else if(name == 'imgurgallery') {
                        info = this.internalAPI.galleryInfoString(data);
                    }

                    if(info) callback(dbot.t('imgurinfo', { 'info': info }));
                }.bind(this);

                if(name == 'imgurimage') { 
                    this.api.getImageInfo(matches[1], dataCallback);
                } else if(name == 'imguralbum') {
                    this.api.getAlbumInfo(matches[1], dataCallback);
                } else if(name == 'imgurgallery') {
                    this.api.getGalleryInfo(matches[1], dataCallback);
                }
            }
        }.bind(this);

        dbot.api.link.addHandler('imguralbum', /https?:\/\/imgur\.com\/a\/([a-zA-Z0-9]+)/, imgurHandler);
        dbot.api.link.addHandler('imgurgallery', /https?:\/\/imgur\.com\/gallery\/([a-zA-Z0-9]+)/, imgurHandler);
        dbot.api.link.addHandler('imgurimage', /https?:\/\/i\.imgur\.com\/([a-zA-Z0-9]+)\.([jpg|png|gif])/, imgurHandler);
        dbot.api.link.addHandler('imgurimage', /https?:\/\/imgur\.com\/([a-zA-Z0-9]+)/, imgurHandler);

        async.times(this.config.ricachelength, function(n, next) {
            this.api.getGoodRandomImage(function(link, imgData) {
                this.riCache.push([ link, imgData ]);
                next();
            }.bind(this));
        }.bind(this), function() {});

        if(!_.has(dbot.db.imgur, 'totalHttpRequests')) dbot.db.imgur.totalHttpRequests = 0; 
        if(!_.has(dbot.db.imgur, 'totalApiRequests')) dbot.db.imgur.totalApiRequests = 0;
        if(!_.has(dbot.db.imgur, 'totalImages')) dbot.db.imgur.totalImages = 0;
        this.db = dbot.db.imgur;
    }.bind(this);
};

exports.fetch = function(dbot) {
    return new imgur(dbot);
}
