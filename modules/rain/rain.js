/**
 * Module Name: Rain
 * Description: Quietly judges your choice of climate. 
 */
var request = require('request'),
    _ = require('underscore')._;

var rain = function(dbot) {
    var commands = {
        '~rain': function(event) {
            var apikey = dbot.config.rain.apikey;
            var place = "Aberystwyth"; // you probably need to change the formulae if you change location
            var url = "http://api.wunderground.com/api/" + apikey + "/conditions/q/CA/" + place + ".json";
            request(url, function(error, response, body) {
                if(response.statusCode == "200") {
                    var data = JSON.parse(body);
                    var precip = data["precip_1hr_metric"];
                    var score = 2 * Math.pow(precip,0.5); 
                    score = Math.ceil(score);
                    if (score > 10) { score = 11; }
                } else {
                    var score = "e";
                }
                event.reply(dbot.t("rain-"+score+"[ " + score + " ]"));
            });
        }
    };

    this.commands = commands;
    this.on = 'PRIVMSG';

};

exports.fetch = function(dbot) {
    return new rain(dbot);
};
