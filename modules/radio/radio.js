/**
 * Module Name: Radio
 * Description: Various icecast functionality.
 */

var _ = require('underscore')._,
    icecast = require('icecast-stack');

var radio = function(dbot) {
	this.listening = false;
	this.data = false;
	this.stream = false;
	this.internalAPI = {
        'startRadio': function() {
            var stream = icecast.createReadStream(this.config.stream);
            this.stream = stream;

            stream.on('connect', function() {
                this.listening = true;
            }.bind(this));

            stream.on('response', function(res) {
                this.data = res.headers;
                _.each(this.config.announce, function(a) {
                    dbot.say(a.server, a.name, dbot.t('now_online', {
                        'name': res.headers['icy-name'],
                        'desc': res.headers['icy-description'],
                        'url': res.headers['icy-url']
                    }));
                });
            }.bind(this));

            stream.on('metadata', function(metadata) {
                var title = icecast.parseMetadata(metadata).StreamTitle;
                _.each(this.config.announce, function(a) {
                    dbot.say(a.server, a.name, dbot.t('now_playing', {
                        'name': this.data['icy-name'],
                        'song': title,
                        'url': this.data['icy-url']
                    }));
                }, this);
            }.bind(this));

            stream.on('end', function() {
                this.stream.end();
                this.listening = false;
            }.bind(this));
        }.bind(this),

        'getRadio': function() {
            dbot.api.timers.addTimer(20000, function() {
                if(this.listening == false) {
                    this.internalAPI.startRadio();
                }
            }.bind(this));
        }.bind(this)
    };
    
    //requesting music by pinging the current DJ
    //dj should be icy-description inside the headers
    //user should be the requesting user
    //request should be the event
    //TODO:pm dj
        
	this.commands={
		'~request music': function(event){
			var dj=this.data['icy-description'];
			var user=event.user;
			var request=event;
			dbot.say(dbot.t('request',{
				'dj':dj,
				'user':user,
				'song':song
			}));
		}
	};
    
    this.onLoad = function() {
        this.internalAPI.getRadio();
    }.bind(this);
    this.onDestroy = function() {
        this.stream.abort();
    }.bind(this);
};

exports.fetch = function(dbot) {
    return new radio(dbot);
};
