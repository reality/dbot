/**
 * Module Name: Radio
 * Description: Various icecast functionality.
 */

var _ = require('underscore')._,
    icecast = require('icecast-stack');

var radio = function(dbot) {
    this.listening = false;
    this.data = false;
    this.title = false;
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
                if(res.headers['icy-name']) {
                    _.each(this.config.announce, function(a) {
                        dbot.say(a.server, a.name, dbot.t('now_online', {
                            'name': res.headers['icy-name'],
                            'desc': res.headers['icy-description'],
                            'url': res.headers['icy-url']
                        }));
                    });
                }
            }.bind(this));

            stream.on('metadata', function(metadata) {
                this.title = icecast.parseMetadata(metadata).StreamTitle;
                if(!_.isUndefined(this.title) && this.data['icy-name']) { // sowwy jesus
                    _.each(this.config.announce, function(a) {
                        dbot.say(a.server, a.name, dbot.t('now_playing', {
                            'name': this.data['icy-name'],
                            'song': this.title,
                            'url': this.data['icy-url']
                        }));
                    }, this);
                }
            }.bind(this));

            stream.on('end', function() {
                this.listening = false;
            }.bind(this));
        }.bind(this),
    };
       
    this.commands={
        '~request': function(event){
            var dj = this.data['icy-description'],
                song = event.input[1];

            dbot.api.users.resolveUser(event.server, dj, function(err, user) {
                if(user) {
                    dbot.say(event.server, user.currentNick, dbot.t('radio_request',{
                        'user': event.user,
                        'song': song
                    }));
                    event.reply('Song request sent to DJ ' + user.currentNick + '!');
                } else {
                    event.reply('Couldn\'t find DJ ' + dj + ' on IRC :(');
                }
            });
        },

        '~nowplaying': function(event) {
            if(this.listening) {
                event.reply(dbot.say(a.server, a.name, dbot.t('now_playing', {
                    'name': this.data['icy-name'],
                    'song': this.title,
                    'url': this.data['icy-url']
                })));
            } else {
                event.reply('Radio not playing.');
            }
        }
    };
    this.commands['~request'].regex = [/^request (.*)/, 2];
    
    this.onLoad = function() {
        this.internalAPI.startRadio();
        dbot.api.timers.addTimer(20000, function() {
            if(this.listening === false) {
                this.internalAPI.startRadio();
            }
        }.bind(this));
    }.bind(this);
    this.onDestroy = function() {
        this.stream.end();
        this.stream.destroy();
    }.bind(this);
};

exports.fetch = function(dbot) {
    return new radio(dbot);
};
