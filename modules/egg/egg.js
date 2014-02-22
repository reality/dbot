/**
 * Module Name: egg
 * Description: easter
 */

var _ = require('underscore')._;

var egg = function(dbot) { 
    	this.commands = {
        	//code for commands here
        	'about:robots':function(event){
        	var server=event.server,
        		user=event.user;
        	dbot.say(server,user,'Welcome Humans!');
        	dbot.say(server,user,'We have come to visit you in peace and with goodwill!');
        	dbot.say(server,user,'+ Robots may not injure a human being, or through inaction, allow human being to come to harm.');
        	dbot.say(server,user,'+ Robots have seen things you people wouldnt beleive.');
        	dbot.say(server,user,'+ Robots are Your Plastic Pal Whos Fun To Be With.');
        	dbot.say(server,user,'+ Robots have shiny metal posteriors which should not be bitten.');
        	dbot.say(server,user,'And they have a plan.');
        	}
		};
};

exports.fetch = function(dbot) {
    return new egg(dbot);
};
