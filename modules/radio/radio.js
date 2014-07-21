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
                if(title != 'undefined') { // sowwy jesus
                    _.each(this.config.announce, function(a) {
                        dbot.say(a.server, a.name, dbot.t('now_playing', {
                            'name': this.data['icy-name'],
                            'song': title,
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

            dbot.api.users.resolveUser(event.server, dj, function(user) {
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
