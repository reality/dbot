/**
 * Module Name: youtube
 * Description: Various Youtube functionality
 */
var _ = require('underscore')._,
    request = require('request');

var youtube = function(dbot) {
    this.ApiRoot = 'https://www.googleapis.com/youtube/v3/';
    this.LinkRegex = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;

    this.api = {
        'search': function(term, callback, type) {
            type = type || "video"
            var qs = _.clone(this.params);
            request.get(this.ApiRoot + 'search', {
                'qs': {
                    'key': this.config.api_key,
                    'q': term,
                    'maxResults': 1,
                    'part': "snippet",
                    'type': type
                },
                'json': true
            }, function(error, response, body) {
                callback(body);
            }.bind(this));
        }
    };

    this.internalAPI = {
        'formatLink': function(v) {
            var time = v.contentDetails.duration.match(/^PT(?:(\d+)M)?(\d+)S$/);

            if(time) {
              if(time[1]) {
                  var seconds =((time[2]%60 < 10) ? "0"+time[2]%60 : time[2]%60),
                      minutes = time[1];
              } else {
                  var seconds =((time[2]%60 < 10) ? "0"+time[2]%60 : time[2]%60),
                      minutes = 0;
              }
            } else {
              minutes = 'id';
              seconds = 'fk';
              console.log(v.contentDetails.duration);
            }

            var res = dbot.t('yt_video', {
                'title': v.snippet.title,
                'plays': v.statistics.viewCount.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,"),
                'author': v.snippet.channelTitle,
                'likes': v.statistics.likeCount,
                'dislikes': v.statistics.dislikeCount,
                'minutes': minutes,
                'seconds': seconds
            });

            if(v.id) {
                res += ' - https://youtu.be/' + v.id;
            }

            return res;
        }.bind(this),

        'formatPlaylistLink': function(v) {
            var res = dbot.t('yt_playlist', {
                'title': v.snippet.title,
                'author': v.snippet.channelTitle,
                'videos': v.contentDetails.itemCount
            });

            if (v.id) {
                res += " - https://www.youtube.com/playlist?list=" + v.id;
            }

            return res;
        }
    };

    this.commands = {
        // search for a youtube video
        '~yt': function(event) {
            this.api.search(event.input[1], function(body) {
                if(_.isObject(body) && _.has(body, 'items') && body.items.length > 0) {
                    request.get(this.ApiRoot + 'videos', {
                        'qs': {
                            'key': this.config.api_key,
                            'id': body.items[0].id.videoId,
                            'maxResults': 1,
                            'part': "snippet,contentDetails,statistics,status"
                        },
                        'json': true
                    }, function(error, response, body) {
                        if(_.isObject(body) && _.has(body, 'items') && body.items.length > 0) {
                            event.reply(this.internalAPI.formatLink(body.items[0]));
                            dbot.modules.link.links[event.channel.name] = 'https://youtu.be/' + body.items[0].id;
                        }
                    }.bind(this));
                } else {
                    event.reply(dbot.t('yt_noresults'));
                }
            }.bind(this), "video");
        },

        // search for a youtube playlist
        '~ytpl': function(event) {
            this.api.search(event.input[1], function(body) {
                if(_.isObject(body) && _.has(body, 'items') && body.items.length > 0) {
                    request.get(this.ApiRoot + 'playlists' , {
                        'qs': {
                            'key': this.config.api_key,
                            'id': body.items[0].id.playlistId,
                            'maxResults': 1,
                            'part': "snippet,contentDetails"
                        },
                        'json': true
                    }, function(error, response, body) {
                        if(_.isObject(body) && _.has(body, 'items') && body.items.length > 0) {
                            event.reply(this.internalAPI.formatPlaylistLink(body.items[0]));
                        }
                    }.bind(this));
                } else {
                    event.reply(dbot.t('yt_noresults'));
                }
            }.bind(this), "playlist");
        }
    };
    this.commands['~yt'].regex = [/^yt (.+)$/, 2];
    this.commands['~ytpl'].regex = [/^ytpl (.+)$/, 2];

    this.onLoad = function() {
        dbot.api.link.addHandler(this.name, this.LinkRegex,
            function(match, name, callback) {
                request.get(this.ApiRoot + 'videos', {
                    'qs': {
                        'key': this.config.api_key,
                        'id': match[2],
                        'maxResults': 1,
                        'part': "snippet,contentDetails,statistics,status"
                    },
                    'json': true
                }, function(error, response, body) {
                    if(_.isObject(body) && _.has(body, 'items') && body.items.length > 0) {
                        callback(this.internalAPI.formatLink(body.items[0]));
                    }
                }.bind(this));
            }.bind(this));
    }.bind(this);
};

exports.fetch = function(dbot) {
    return new youtube(dbot);
};
