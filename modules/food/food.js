/**
 * Module name: Food
 * Description: recipe search
 */

var _ = require('underscore')._,
   request = require('request');

var food = function(dbot) {
    this.commands = {
        '~recipe': function(event) {
            request.get('http://food2fork.com/api/search', {
                'qs': { 
                    'key': this.config.api_key,
                    'q': event.input[1]
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
    this.commands['~recipe'].regex = [/^recipe (.+)$/, 2];

    this.listener = function(event) {
        var match = event.message.match(new RegExp(dbot.config.name + ': what should i (have|eat|make)\\??( for dinner)?\\??', 'i'));
        if(match) {
            request.get('http://food2fork.com/api/search', {
                'qs': { 
                    'key': this.config.api_key,
                },
                'json': true
            }, function(error, response, body) {
                if(_.isObject(body) && _.has(body, 'recipes') && body.recipes.length > 0) {
                    var num = _.random(0, body.recipes.length - 1),
                        recipe = body.recipes[num];

                    event.reply('You should make ' + recipe.title + '. See: ' + recipe.source_url);
                }
            }.bind(this));
        }
    }.bind(this);
    this.on = 'PRIVMSG';
};

exports.fetch = function(dbot) {
    return new food(dbot);
};
