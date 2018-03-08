/**
 * Name: Spotify
 * Description: Various Spotify functionality
 */
var request = require('request'),
        _ = require('underscore')._;

var spotify = function(dbot) {
    /* Examples:
     * http://open.spotify.com/track/42SYMWISn7xUpTNPLw9V5E
     * spotify:track:42SYMWISn7xUpTNPLw9V5E
     * http://open.spotify.com/artist/3yY2gUcIsjMr8hjo51PoJ8
     * spotify:artist:3yY2gUcIsjMr8hjo51PoJ8
     * http://open.spotify.com/album/30g571JKoxs8AnsgAViV2J
     * spotify:album:30g571JKoxs8AnsgAViV2J
     */
    this.spotifyRegex = /(\b(https?:\/\/open.spotify.com\/(artist|track|album)\/\w*|spotify:(artist|track|album):\w*)\b)/ig;
    this.spotifyLookup = 'http://ws.spotify.com/lookup/1/.json';
    this.spotifySearch = 'https://api.spotify.com/v1/search';
    this.youtubeRegex = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    this.spotifyText = '\u00039spotify\u000f';
	this.spotifyAuthUrl = 'https://accounts.spotify.com/api/token';
	
	// ClientID and ClientSecret come from the spotify developer center; you will need to supply your own.
	this.spotifyClientID = 'e2491c50879a4d7f900dcefcc74b7c90';
	this.spotifyClientSecret = 'b29da299612e4e659099ab3367ffa3f4';
	this.spotifyAuth = new Buffer(this.spotifyClientID + ":" + this.spotifyClientSecret).toString("base64");

	this.authenticate = function(callback) {
		request({
			url: this.spotifyAuthUrl,
			method: "POST",
			headers: { Authorization: "Basic " + this.spotifyAuth },
			form: { grant_type: "client_credentials" }
		}, function(error, response, body) {
			if (!error && response.statusCode == 200) {
				body = JSON.parse(body);
				var token = body.access_token;
				callback(token);
			}
		});
	};

    this.lookup = function(link, callback) {
		this.authenticate(function(token) {
			request({
				'url': this.spotifyLookup,
				'qs': { 'uri': link },
				'json': true,
				'headers': { 'Authorization': "Bearer " + token }
			}, function(error, response, body) {
				if(!error && response.statusCode == 200) {
					if(_.has(body, 'track')) {
						callback(dbot.t('track', {
							'artist': _.map(body.track.artists, 
								function(a) { return a.name }).join(', '), 
							'album': body.track.album.name, 
							'track': body.track.name
						}));
					} else if(_.has(body, 'album')) {
						callback(dbot.t('album', {
							'artist': body.album.artist, 
							'album': body.album.name
						}));
					} else if(_.has(body, 'artist')) {
						callback(dbot.t('artist', {
							'artist': body.artist.name
						}));
					}
				}
			});
		}.bind(this));
    };

    this.api = {
        'spotifySearch': function(query, callback) {
            this.authenticate(function(token) {
				request({
					'url': this.spotifySearch,
					'qs': { 'q': query, 'type': 'track' },
					'json': true,
					'headers': { 'Authorization': "Bearer " + token }
				}, function(error, response, body) {
					if(!error && response.statusCode == 200) {
						if(_.has(body, 'tracks') && body.tracks.items[0] && _.has(body.tracks.items[0], 'href')) {
							var t = body.tracks.items[0].href;
							///*t = t.replace(/:/g, '/');
							t = t.replace(/api.spotify.com\/v1\/tracks/,
							'open.spotify.com/track');
							callback(body, t);
						} else {
							callback(false);
						}
					}
				});
			}.bind(this));
        }
    };

    var commands = {
        '~spotify': function(event) {
            var query = event.input[1];
            this.api.spotifySearch(query, function(body, t) {
                if(body) {
                    event.reply(dbot.t('found', {
                        'artist': _.map(body.tracks.items[0].artists, function(a) { 
                                return a.name }).join(', '), 
                        'album': body.tracks.items[0].album.name, 
                        'track': body.tracks.items[0].name, 
                        'url': t
                    }));
                } else {
                    event.reply(dbot.t('not-found'));
                }
            }.bind(this));
        },

        '~syt': function(event) {
            var lastLink = dbot.modules.link.links[event.channel.name];
            if(!_.isUndefined(event.params[1])) {
                lastLink = event.params[1];
            }
            
            if(lastLink.match(this.youtubeRegex)) {
                dbot.api.link.getTitle(lastLink, function(title) {
                    name = title.replace(' - YouTube', '');
                    this.api.spotifySearch(name, function(body, t) {
						if(body) {
							event.reply(dbot.t('found', {
                                'artist': _.map(body.tracks.items[0].artists, 
                                    function(a) { return a.name }).join(', '), 
                                'album': body.tracks.items[0].album.name, 
                                'track': body.tracks.items[0].name, 
                                'url': t
                            }));
                        } else {
                            event.reply(dbot.t('not-found'));
                        }
                    }.bind(this));
                }.bind(this));
            } else {
                event.reply('That\'s not a YouTube link');
            }
        }
    };
    commands['~spotify'].regex = [/^spotify (.*)/, 2];
    this.commands = commands;

    this.onLoad = function() {
        dbot.api.link.addHandler(this.name, this.spotifyRegex, function(matches, name, callback) {
            this.lookup(matches[0], callback);
        }.bind(this));
    }.bind(this);
};

exports.fetch = function(dbot) {
    return new spotify(dbot);
};
