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
            var place = event.input[1];
            if (!place) { var place = "Aberystwyth"; }
            var url = "http://api.wunderground.com/api/" + apikey + "/conditions/q/CA/" + place + ".json";
            request(url, function(error, response, body) {
                if(response.statusCode == "200") {
                    var data = JSON.parse(body);
                    var obs = data["current_observation"];
                    if (obs) {
                        var precip = obs["precip_1hr_metric"];
                        var score = 2 * Math.pow(precip,0.5); 
                        score = Math.ceil(score);
                        if (score > 10) { score = 11; }
                    } else {
                        var score = "u";
                    }
                } else {
                    var score = "e";
                }
                event.reply(dbot.t("rain-"+score));
            });
        }
    };

    commands['~rain'].regex = [/~rain (.+)/, 2];
    this.commands = commands;
    this.on = 'PRIVMSG';

};

exports.fetch = function(dbot) {
    return new rain(dbot);
};
