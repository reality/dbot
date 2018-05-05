/**
 * Module Name: omdb
 * Description: Interacts with the Open Movie Database to provide movie summary
 *              and review information.
 */

var rp = require('request-promise-native'),
    _ = require('underscore')._;

var OMDB = function(dbot) {
  this.apiRoot = 'http://www.omdbapi.com';
  this.imdbLinkPrefix = 'https://www.imdb.com/title/';

  this.internalAPI = {
    formatLink: r => {
      var aRating = parseFloat(r.imdbRating) * 10;
      var cRating = parseFloat(r.Metascore);

      if (isNaN(aRating)) {
        aRating = " N/A";
      } else {
        var aColour = (aRating <= 5) ? '\u00033 ' : '\u00034 ';
        aRating = aColour + String(aRating) + '%\u000f';
      }

      if (isNaN(cRating)) {
        cRating = " N/A";
      } else {
        var cColour = (cRating <= 5) ? '\u00033 ' : '\u00034 ';
        cRating = cColour + String(cRating) + '%\u000f';
      }

      var mString = dbot.t('omdb_film', {
        'title': r.Title,
        'year': r.Year,
        'aRating': aRating,
        'cRating': cRating
      });

      if (_.has(r, 'Director') && r.Director != "N/A") mString += ' [Director: ' + r.Director + ']';
      if (_.has(r, 'Genre') && r.Genre != "N/A") mString += ' [Genre: ' + r.Genre + ']';
      if (_.has(r, 'Plot') && r.Plot != "N/A") {
        if (r.Plot.length > 140) r.Plot = r.Plot.substring(0, 140) + '...';
        mString += ' [Plot: ' + r.Plot + ']';
      }

      mString += ' - ' + this.imdbLinkPrefix + r.imdbID;

      return mString;
    }
  };

  this.commands = {
    '~movie': async event => {
      try {
        var r = await rp({
          url: this.apiRoot,
          qs: {
            apikey: this.config.api_key,
            t: event.input[1],
            plot: 'short',
            r: 'json'
          },
          json: true
        });

        if (r.Response === 'True') {
          event.reply(this.internalAPI.formatLink(r));
        } else {
          event.reply(dbot.t('omdb_noresults'));
        }
      }
      catch (e) {
        console.log(e);
      }
    }
  };

  this.commands['~movie'].regex = [/^movie (.+)$/, 2];
}


exports.fetch = dbot => new OMDB(dbot);
