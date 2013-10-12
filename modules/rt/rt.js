/**
 * Module Name: Rotten Tomatoes
 * Description: Various Rotten Tomatoes functionality.
 */

var _ = require('underscore')._,
   request = require('request');

var rt = function(dbot) {
    var ApiRoot = 'http://api.rottentomatoes.com/api/public/v1.0/';

    this.internalAPI = {
        'formatLink': function(m) {
            var rating = m.ratings.audience_score;
            if(_.has(m.ratings, 'critics_score')) rating = m.ratings.critics_score;
            var rColour = (rating <= 50) ? '\u00033 ' : '\u00034 ';
            rating = rColour + String(rating) + '%\u000f';

            return dbot.t('rt_film', {
                'title': m.title,
                'year': m.year,
                'link': m.links.alternate,
                'rating': rating
            });
        }
    };

    this.commands = {
        '~film': function(event) {
            //http://api.rottentomatoes.com/api/public/v1.0/movies.json?q={search-term}&page_limit={results-per-page}&page={page-number}
            request.get(ApiRoot + 'movies.json', {
                'qs': { 
                    'q': event.input[1],
                    'page_limit': 1,
                    'apikey': this.config.apikey
                },
                'json': true
            }, function(error, response, body) {
                if(_.isObject(body) && _.has(body, 'movies')) {
                    event.reply(this.internalAPI.formatLink(body.movies[0]));
                } else {
                    event.reply(dbot.t('rt_noresults'));
                }
            }.bind(this));
        }
    };
    this.commands['~film'].regex = [/^~film (.+)$/, 2];
};

exports.fetch = function(dbot) {
    return new rt(dbot);
};
