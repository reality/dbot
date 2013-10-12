/**
 * Module Name: IMDB
 * Description: Various IMDB functionality.
 */

var _ = require('underscore')._,
   request = require('request');

var imdb = function(dbot) {
    var ApiRoot = 'http://mymovieapi.com/';

    this.internalAPI = {
        'formatLink': function(m) {
            var rating = m.rating;
            var rColour = (rating <= 5) ? '\u00033 ' : '\u00034 ';
            rating = rColour + String(rating) + '\u000f';

            var mString = dbot.t('imdb_film', {
                'title': m.title,
                'year': m.year,
                'rating': rating
            });

            if(_.has(m, 'directors')) mString += ' [Director: ' + m.directors[0] + ']';
            if(_.has(m, 'genres')) mString += ' [Genre: ' + m.genres[0] + ']';
            if(_.has(m, 'plot_simple')) mString += ' [Description: ' + m.plot_simple + ']';
            mString += ' - ' + m.imdb_url;

            return mString;
        }
    };

    this.commands = {
        '~film': function(event) {
            request.get(ApiRoot + 'movies.json', {
                'qs': { 
                    'q': event.input[1],
                    'page_limit': 1
                },
                'json': true
            }, function(error, response, body) {
                if(_.isObject(body) && !_.isUndefined(body[0])) {
                    event.reply(this.internalAPI.formatLink(body[0]));
                } else {
                    event.reply(dbot.t('imdb_noresults'));
                }
            }.bind(this));
        }
    };
    this.commands['~film'].regex = [/^~film (.+)$/, 2];
};

exports.fetch = function(dbot) {
    return new imdb(dbot);
};
