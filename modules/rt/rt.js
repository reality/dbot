/**
 * Module Name: RT
 * Description: Various RT functionality.
 */

var _ = require('underscore')._,
   request = require('request');

var rt = function(dbot) {
    var ApiRoot = 'http://api.rottentomatoes.com/api/public/v1.0/';

    this.internalAPI = {
        'formatLink': function(m) {
            var aRating = m.ratings.audience_score;
            var cRating = m.ratings.critics_score;

            var aColour = (aRating <= 5) ? '\u00033 ' : '\u00034 ';
            aRating = aColour + String(aRating) + '%\u000f';

            var cColour = (cRating <= 5) ? '\u00033 ' : '\u00034 ';
            cRating = cColour + String(cRating) + '%\u000f';

            var mString = dbot.t('rt_film', {
                'title': m.title,
                'year': m.year,
                'audience_rating': aRating,
                'critic_rating': cRating
            });

            if(_.has(m, 'directors')) mString += ' [Director: ' + m.directors[0] + ']';
            if(_.has(m, 'genres')) mString += ' [Genre: ' + m.genres[0] + ']';
            if(_.has(m, 'synopsis') && m.synopsis != '') {
                if(m.synopsis.length > 140) m.synopsis = m.synopsis.substring(0, 140) + '...';
                mString += ' [Synopsis: ' + m.synopsis + ']';
            } else if(_.has(m, 'critics_consensus')) {
                mString += ' [Review: ' + m.critics_consensus + ']';
            }
            mString += ' - http:' + m.links.alternate;

            return mString;
        }
    };

    this.commands = {
        '~rt': function(event) {
            request.get(ApiRoot + 'movies.json', {
                'qs': { 
                    'q': event.input[1],
                    'page_limit': 1,
                    'apikey': this.config.api_key
                },
                'json': true
            }, function(error, response, body) {
                if(_.isObject(body) && _.has(body, 'movies') && !_.isUndefined(body.movies[0])) {
                    event.reply(this.internalAPI.formatLink(body.movies[0]));
                } else {
                    event.reply(dbot.t('rt_noresults'));
                }
            }.bind(this));
        }
    };
    this.commands['~rt'].regex = [/^rt (.+)$/, 2];
};

exports.fetch = function(dbot) {
    return new rt(dbot);
};
