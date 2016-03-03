/**
 * Module name: Translate
 * Description: Translate things (funnily enough)
 */

var _ = require('underscore')._,
   request = require('request');

var translate = function(dbot) {
  var ApiRoot = 'https://glosbe.com/gapi/translate';

  this.api = {
    'getTranslation': function(from, to, word, callback) {
       request.get(ApiRoot, {
        'qs': {
          'from': from,
          'dest': to,
          'phrase': word,
          'format': 'json'
        },
        'json': true
      }, function(err, res, body) {
        if(!err && _.has(body, 'tuc')) {
          callback(false, body.tuc);
        } else {
          callback(true, null);
        }
      });
    }
  };

  this.commands = {
    't': function(event) {
      var from = event.params[1],
          to = event.params[2],
          word = event.params[3];

      this.api.getTranslation(from, to, word, function(err, results) {
        if(!err) {
          if(results.length > 0) {
            var answerStrings = [],
                translation,
                aString;
            
            for(var i=0;i<results.length && i < 3;i++) {
              translation = results[i];
              if(!_.has(translation.phrase, 'text')) {
                continue;
              }
              aString = (i+1) + '. ' + translation.phrase.text;
              if(_.has(translation, 'meanings') && translation.meanings.length > 0) {
                aString += ' (' + _.unique(_.pluck(translation.meanings, 'text')).join(', ') + ')';
              }
              answerStrings.push(aString);
            }

            event.reply(word + ' in ' + to + ': ' + answerStrings.join(' '));
          } else {
            event.reply('No known translations for that word');
          }
        } else {
          event.reply('Unable to get translations :\'(');
        }
      });
    }
  };
}

exports.fetch = function(dbot) {
    return new translate(dbot);
};
