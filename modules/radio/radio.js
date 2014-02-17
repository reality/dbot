/**
 * Module Name: Radio
 * Description: Various icecast functionality.
 */

var _ = require('underscore')._,
    icecast = require('icecast-stack');

var radio = function(dbot) {
    this.listening = false;
    this.data = false;
    this.internalAPI = {
        'startRadio': function() {
            var stream = icecast.createReadStream(this.config.stream);

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
        }.bind(this)
    };
    this.onLoad = function() {
        this.internalAPI.startRadio();
    }.bind(this);
};

exports.fetch = function(dbot) {
    return new radio(dbot);
};
