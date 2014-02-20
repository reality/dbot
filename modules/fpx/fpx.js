/**
 * Module Name: 500px
 * Description: Adds various 500px functionality.
 * Requires: node-500px [http://mjgil.github.io/five-px/]
 */

var _ = require('underscore')._,
    API500px = require('500px').API500px;

var fpx = function(dbot) {
    this.commands = {
        '~r500px': function(event) {
            var random = Math.floor(Math.random() * 30);
            this.api500px.photos.getPopular({'sort': 'created_at', 'rpp': '30'},  function(error, results) {
                if (error) {
                    event.reply(dbot.t('5px_error'));
                    console.log(error);
                } else {
                    var name = results.photos[random].name,
                        url = results.photos[random].image_url;
                    event.reply(dbot.t('5px_result',{'name':name,'url':url}));
                }
            });
        }
    };
    this.onLoad = function() {
        this.api500px = new API500px(this.config.api_key);
    }.bind(this);
};

exports.fetch = function(dbot) {
    return new fpx(dbot);
};
