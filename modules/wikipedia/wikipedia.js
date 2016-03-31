/**
 * Module name: Wikipedia
 */

var _ = require('underscore')._,
   request = require('request');

var wikipedia = function(dbot) {

  this.api = {
    'getSentence': function(term, random, cb) {
      request.get('https://en.wikipedia.org/w/api.php', {
        'qs': {
          'action': 'opensearch',
          'search': term
        },
        'json': true
      }, function(error, response, body) {
        if(body && body[1].length != 0) {
          request.get('https://en.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content&format=json&&titles='+body[1][0], {'json': true}, function(error, response, body) {
            body = body.query.pages
            for(var prop in body) {
              break;
            }

            body = body[prop].revisions[0]['*'];
            var oBody = body;

            var redirect = body.match(/#redirect \[\[(.+)\]\]/i);
            if(redirect) {
              return this.api.getSentence(redirect[1], random, cb);
            }

            var refer = body.match(/may refer to:/i);
            if(refer) {
              var links = body.match(/\[\[(.+)\]\]/g);
              return this.api.getSentence(links[_.random(0,links.length-1)], random, cb);
            }

            body = body.replace(/=(.+)=/g,'');
            body = body.replace(/\t/g,'');
            body = body.replace(/\{(.+)\}/g,'');
            body = body.replace(/(\[|\])/g,'');
            body = body.replace(/(\(|\))/g,'');
            body = body.replace(/\*\s?/g,'');
            body = body.replace(/<.+?>.+<.+?>/g,'');
            body = body.replace(/<.+?>/g,'');
            body = body.replace(/(\w+)\|([^ ^, ^\.]+)/g,'$2');
            body = body.replace(/'+/g, '\'');

            body = body.split('\n');

            if(random == false) {
              var newBody = [];
              _.each(body, function(line) {
              console.log(line.split('. '));
                newBody = _.union(newBody, line.split('. '));
              });

              body = newBody;
            }


            body = _.filter(body, function(line) {
              var spaces = line.match(/\s/g);
              return line != '' && !line.match(/{|}/) && !line.match(/^\s+$/) && !line.match(/^!/) && !line.match(/^#/) && !line.match(/^File:/) && !line.match(/^Image:/) && !line.match(/^Category:/) && !line.match(/http:\/\//) && !line.match(/^\s*\|/) && !line.match(/:$/) && spaces && spaces.length > 5 && spaces.length < 100;
            });
            if(random == true) {
              var sentence = body[_.random(0, body.length -1)];
            } else {
              var sentence = body[0];
            }

            if(_.isUndefined(sentence)) {
              var links = oBody.match(/\[\[(.+)\]\]/g);
              return this.api.getSentence(links[_.random(0,links.length-1)], random, cb);
            }

            var w = sentence.split(' ');
            if(w.length > 50) {
              sentence = w.slice(0, 60).join(' ') + '...';
            }

            cb(sentence);
          }.bind(this));
        }
      }.bind(this));
    }
  };

  this.commands = {
    '~lol': function(event) {
      this.api.getSentence(event.input[1], true, function(sentence) {
        event.reply(sentence);
      });
    },

    '~summary': function(event) {
      this.api.getSentence(event.input[1], false, function(sentence) {
        event.reply(sentence);
      });
    },

    '~w': function(event) {
	  request.get('http://wikipedia.org/w/api.php', {
		'qs': {
		  'action': 'opensearch',
		  'search': event.input[1].replace(/\s/,'_'),
		  'limit': 1,
		  'namespace': 0,
		  'format': 'json'
		},
		'json': true
	  }, function(err, res, body) {
		if(!err && body[1].length !== 0) {
		  event.reply(event.input[1] + ': https://wikipedia.org/wiki/'+body[1][0].replace(/\s/g, '_'));
		} else {
		  event.reply(event.input[1] + ' not found.');
		}
	  });
    }
  };
  this.commands['~lol'].regex = [/^lol ([\d\w\s-]*)/, 2];
  this.commands['~summary'].regex = [/^summary ([\d\w\s-]*)/, 2];
  this.commands['~w'].regex = [/^w (.+)/, 2];

};

exports.fetch = function(dbot) {
    return new wikipedia(dbot);
};
