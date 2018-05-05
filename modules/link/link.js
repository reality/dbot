/**
 * Module Name: Link
 * Description: Stores recent channel links, with commands to retrieve
 * information about links.
 */
var request = require('request'),
    _ = require('underscore')._,
    ent = require('ent');

var link = function(dbot) {
    this.urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    this.links = {};
    this.handlers = [];

    this.api = {
        'addHandler': function(name, regex, handler) {
            this.handlers.push({
                'name': name,
                'regex': regex,
                'callback': handler
            });
        },

        'getTitle': function(link, callback) {
            var limit = 1000000,
            size = 0,
            page = request(link.replace('https', 'http'), function(error, response, body) {
                if(!error && response.statusCode == 200) {
                    body = body.replace(/(\r\n|\n\r|\n)/gim, " ");
                    var title = body.valMatch(/<title>(.*?)<\\?\/title>/, 2);
                    if(title && title.length < 140) {
                        callback(ent.decode(title[1]).trim());
                    }
                }
            });

            page.on('data', function(chunk) {
                size += chunk.length;
                if(size > limit) {
                    page.abort();
                }
            });
        },

        'udLookup': function(query, callback) {
            var reqUrl = 'http://api.urbandictionary.com/v0/define?term=' +
                    encodeURI(query);

            request(reqUrl, function(error, response, body) {
                try {
                    var result = JSON.parse(body);
                    if(_.has(result, 'result_type') && result.result_type != 'no_results') {
                        callback(result.list[0].word, result.list[0].definition.split('\n')[0]);
                    } else {
                        callback(false);
                    }
                } catch(err) { callback(false); }
            });

        },

        'parseLink': function(link, callback) {
            var handler = false;
            for(var i=0;i<this.handlers.length;i++) {
                var matches = this.handlers[i].regex.exec(link);
                if(matches) {
                    console.log(this.handlers[i].name);
                    handler = this.handlers[i];
                    break;
                }
            }

            if(handler) {
                this.handlers[i].callback(matches, this.handlers[i].name, function(parsed) {
                    callback(parsed);
                });
            } else {
                this.api.getTitle(link, function(title) {
                    callback(dbot.t('link', { 'link': title } ));
                });
            }
        }
    };

    var commands = {
        '~title': function(event) {
            var link = this.links[event.channel.name];
            if(!_.isUndefined(event.params[1])) {
                var urlMatches = event.params[1].match(this.urlRegex);
                if(urlMatches !== null) {
                    link = urlMatches[0];
                }
            }
            this.api.getTitle(link, function(title) {
                event.reply(dbot.t('link', { 'link': title} ));
            });
        },

        '~xkcd': function(event) {
            //var comicId = event.params[1] || "";
            var comicId = event.params.slice(1).join(' ');

            if(comicId == "*") {
                request("http://xkcd.com/info.0.json",  function(error, response, body){
                    try {
                        if(response.statusCode == "200") {
                            data = JSON.parse(body);
                            event.params[1] = (Math.floor(Math.random() * data.num) + 1);
                            dbot.commands['~xkcd'](event);
                        }
                    } catch(err) { };
                });
            } else {
                if (isNaN(parseInt(comicId))) {
                    request({
                      url: 'http://www.explainxkcd.com/wiki/api.php',
                      qs: {
                        action: 'query',
                        format: 'json',
                        generator: 'search',
                        gsrwhat: 'text',
                        gsrsearch: comicId,
                        prop: 'info|categories',
                        gsrlimit: 50
                      },
                      json: true
                    }, function(err, res, body) {
                      if(!body) {
                        event.reply(dbot.t("no-hits"));
                        return;
                      }

                      var pages = _.values(body.query.pages);

                      // page titles must be of the format "####: $$$$$$"
                      pages = _.filter(pages, p => p.title.indexOf(':') > 0);

                      if (pages.length > 0) {
                        // See if any of these matches are exact title matches
                        var match = false;
                        _.each(pages, function(p) {
                          var title = p.title.slice(p.title.indexOf(':')+2).trim();
                          if(title.toLowerCase() == comicId.toLowerCase()) {
                            match = p;
                          }
                        });

                        if (match) {
                          // We got a match! Get the ID and let's get tf out of here.
                          comicId = match.title.slice(0, match.title.indexOf(':'));
                        } else {
                          comicId = pages[0].title.slice(0, pages[0].title.indexOf(':'));
                        }

                        var link = "http://xkcd.com/"+comicId+"/info.0.json";
                        request(link,  function(error, response, body) {
                            try {
                                if (response.statusCode == "200") {
                                    data = JSON.parse(body);
                                    event.reply(dbot.t("xkcd", data));
                                } else {
                                    event.reply(dbot.t("no-hits"));
                                }
                            } catch(err) { };
                        });


                      } else {
                        event.reply(dbot.t("no-hits"));
                      }
                    });
                } else {
                    if(comicId !== "") {
                        comicId = comicId + "/";
                    }

                    var link = "http://xkcd.com/"+comicId+"info.0.json";
                    request(link,  function(error, response, body) {
                        try {
                            if (response.statusCode == "200") {
                                data = JSON.parse(body);
                                event.reply(dbot.t("xkcd", data));
                            } else {
                                event.reply(dbot.t("no-hits"));
                            }
                        } catch(err) { };
                    });
                }
            }
        },

        '~ud': function(event) {
            var query = event.input[1];

            this.api.udLookup(query, function(word, definition) {
                if(word) {
                    event.reply(word + ': ' + definition);
                } else {
                    event.reply(event.user + ': No definition found.');
                }
            });
        }
    };
    commands['~ud'].regex = [/ud (.+)/, 2];
    this.commands = commands;

    this.listener = function(event) {
        var urlMatches = event.message.match(this.urlRegex);
        if(urlMatches !== null) {
            this.links[event.channel.name] = urlMatches[0];
            console.log('DEBUG: got a link');
            if(this.config.autoTitle == true) {
                this.api.parseLink(urlMatches[0], function(result) {
                    event.reply(result);
                });
            }
        }
    }.bind(this);
    this.on = 'PRIVMSG';
};

exports.fetch = function(dbot) {
    return new link(dbot);
};
