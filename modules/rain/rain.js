/**
 * Module Name: Rain
 * Description: Quietly judges your choice of climate. 
 */
var request = require('request'),
    _ = require('underscore')._;

var rain = function(dbot) {
    var commands = {
        '~rain': function(event) {
            var precip = event.params[1];
            var score = 2 * Math.pow(precip,0.5); 
            score = Math.ceil(score);
            if (score > 10) { score = 11; }
            event.reply(dbot.t("rain-"+score));
        }
    };

    this.commands = commands;
    this.on = 'PRIVMSG';

};

exports.fetch = function(dbot) {
    return new rain(dbot);
};
