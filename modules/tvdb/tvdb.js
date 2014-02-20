/**
 * Module Name: theTVDB
 * Description: Addes various TVDB functionality.
 * Requires: node-tvdb [https://github.com/enyo/node-tvdb]
 */

var _ = require('underscore')._,
    TVDB = require('tvdb');

var tvdb = function(dbot) {
    this.commands = {
        '~tvdb' : function(event) {
            var query = event.input[1];
            this.thetvdb.findTvShow(query, function(err, tvShows) {
                if (err) {
                    event.reply(dbot.t('tvdb_error'));
                } else {
                    // Handle tvShows.
                    var name = tvShows[0].name,
                        id = tvShows[0].id;

                    event.reply(dbot.t('tvdb_result', {
                        'name': name,
                        'id': id
                    }));
                }
            });
        }
    };
    this.commands['~tvdb'].regex = [/^tvdb ([\d\w\s-]*)/, 2];
    
    this.onLoad = function() {
        this.thetvdb = new TVDB({ 'apiKey': this.config.api_key });
    }.bind(this);
};

exports.fetch = function(dbot) {
    return new tvdb(dbot);
};
