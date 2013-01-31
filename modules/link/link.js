/**
 * Module Name: Link
 * Description: Stores recent channel links, with commands to retrieve
 * information about links.
 */
var request = require('request'),
    _ = require('underscore')._;

var link = function(dbot) {
    this.urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    this.links = {}; 
    this.fetchTitle = function(event, link) {
        request(link, function(error, response, body) {
            if(!error && response.statusCode == 200) {
                body = body.replace(/(\r\n|\n\r|\n)/gm, " ");
                var title = body.valMatch(/<title>(.*)<\/title>/, 2);
                if(title) {
                    event.reply(title[1]);
                }
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
            var comicId = event.params[1];	
            if(comicId == "*"){
                request("http://xkcd.com/info.0.json",  function(error, response, body){
                    if (response.statusCode == "200") {
                        data = JSON.parse(body);
                        comicId = data.num;
                        comicId = (Math.floor(Math.random() * comicId) + 1);
                        event.params[1] = comicId;
                        dbot.commands['~xkcd'](event);
                    }
                });	
            }else {
                if(comicId){
                    comicId = comicId + "/";
                } else {
                    comicId = "";
                }
                var link = "http://xkcd.com/"+comicId+"info.0.json";
                request(link,  function(error, response, body) {
                    if (response.statusCode == "200") {
                        data = JSON.parse(body);
                        event.reply(dbot.t("xkcd",data));
                    } else {
                        event.reply(dbot.t("no-hits"));
                    }
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
                        event.reply(query + ': ' + result.list[0].definition.split('\n')[0]);
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
