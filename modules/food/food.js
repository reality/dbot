/**
 * Module name: Food
 * Description: recipe search
 */

var _ = require('underscore')._,
   request = require('request');

var food = function(dbot) {
    this.commands = {
        '~strain': function(event) {
            request.get('http://food2fork.com/api/search', {
                'qs': { 
                    'key': this.config.api_key,
                    'search': event.input[1]
                },
                'json': true
            }, function(error, response, body) {
                if(_.isObject(body) && _.has(body, 'recipes') && body.recipes.length > 0) {
                    var num = _.random(0, body.recipes.length - 1),
                        recipe = body.recipes[num];

                    event.reply(dbot.t('recipe', {
                        'title': recipe.title,
                        'link': recipe.source_url 
                    }));
                } else {
                    event.reply(dbot.t('no_recipe'));
                }
            }.bind(this));
        }
    };
    this.commands['~food'].regex = [/^food (.+)$/, 2];
};

exports.fetch = function(dbot) {
    return new food(dbot);
};
