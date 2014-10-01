/**
 * Module name: Leafly
 * Description: Information from leafly
 */

var _ = require('underscore')._,
   request = require('request');

var leafly = function(dbot) {
    var ApiRoot = 'http://data.leafly.com/';

    this.commands = {
        '~strain': function(event) {
            request.post(ApiRoot + 'strains', {
                'headers': {
                    'app_key': this.config.app_key,
                    'app_id': this.config.app_id
                },
                'body': { 
                    'page': 0,
                    'take': 1,
                    'sort': 'rating',
                    'search': event.input[1]
                },
                'json': true
            }, function(error, response, body) {
                if(_.isObject(body) && _.has(body, 'Strains') && body.Strains.length > 0) {
                    var strain = body.Strains[0],
                        flavours = _.pluck(strain.Flavors, 'Name').join(', ');

                    event.reply(dbot.t('strain', {
                        'name': strain.Name,
                        'flavours': flavours,
                        'link': strain.permalink
                    }));
                } else {
                    event.reply(dbot.t('no_strains'));
                }
            }.bind(this));
        }
    };
    this.commands['~strain'].regex = [/^strain (.+)$/, 2];
};

exports.fetch = function(dbot) {
    return new leafly(dbot);
};
