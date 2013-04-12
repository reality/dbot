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
    this.fetchTitle = function(event, link) {
        var limit = 1000000,
        size = 0,
        page = request(link, function(error, response, body) {
            if(!error && response.statusCode == 200) {
                body = body.replace(/(\r\n|\n\r|\n)/gm, " ");
                var title = body.valMatch(/<title>(.*)<\/title>/, 2);
                if(title && title.length < 140) {
                    event.reply(ent.decode(title[1]).trim());
                }
            }
        });

        page.on('data', function(chunk) {
            size += chunk.length;
            if(size > limit) {
                page.abort();
            }
        });
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
            this.fetchTitle(event, link);
        },
        
        '~xkcd': function(event) {
            var comicId = event.params[1] || "";

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
                if(comicId !== "") {
                    comicId = comicId + "/";
                }

                var link = "http://xkcd.com/"+comicId+"info.0.json";
                request(link,  function(error, response, body) {
                    try {
                        if (response.statusCode == "200") {
                            data = JSON.parse(body);
                            event.reply(dbot.t("xkcd",data));
                        } else {
                            event.reply(dbot.t("no-hits"));
                        }
                    } catch(err) { };
                });
            }
            
        },
        
        '~ud': function(event) {
            var query = event.input[1];
            var reqUrl = 'http://api.urbandictionary.com/v0/define?term=' + encodeURI(query); 

            request(reqUrl, function(error, response, body) {
                try {
                    var result = JSON.parse(body);
                    if(_.has(result, 'result_type') && result.result_type != 'no_results') {
                        event.reply(result.list[0].word + ': ' + result.list[0].definition.split('\n')[0]);
                    } else {
                        event.reply(event.user + ': No definition found.');
                    }
                } catch(err) { }
            });
        }
    };
    commands['~ud'].regex = [/~ud (.+)/, 2];
    this.commands = commands;

    this.listener = function(event) {
        var urlMatches = event.message.match(this.urlRegex);
        if(urlMatches !== null) {
            this.links[event.channel.name] = urlMatches[0];
            if(dbot.config.link.autoTitle == true) {
                this.fetchTitle(event, urlMatches[0]);
            }
        }
    }.bind(this);
    this.on = 'PRIVMSG';
};

exports.fetch = function(dbot) {
    return new link(dbot);
};
