/**
 * Module Name: theTVDB
 * Description: Addes various TVDB functionality.
 * Requires: node-tvdb [https://github.com/enyo/node-tvdb]
 */

var _ = require('underscore')._,
	TVDB = require('tvdb'),
	thetvdb = new TVDB({ apiKey: this.config.apiKey });//dependencies

var tvdb = function(dbot) { //name of module

		this.ApiRoot = 'API_ROOT_HERE';
		
		this.internalAPI = {
        //code for internal api here
		};

		this.api = {
		//code for api here
		};

    	this.commands = {
        	//code for commands here
        	'~tvdb' : function(){
        		var query = event.input[1];
        		thetvdb.findTvShow(query, function(err, tvShows) {
  					if (err) 
  					{
  						event.respond(dbot.t('error');
  						return;
  					}
  					else
  					{
  						// Handle tvShows.
  						var name=tvShows[0].SeriesName,
  							banner=tvShows[0].banner,
  							id=tvShows[0].id;
  						event.reply(dbot.t('result',{'name':name,'banner'=banner,'id'=id}));
  					}
				};
        	
        	}
		};
		
		this.onLoad = function() {
        //code for stuff to be done on load here
        };
        
        this.onDestroy = function() {
        //stuff to be done on destroy here
    	};
    }

};

exports.fetch = function(dbot) {
    return new tvdb(dbot); //name of module
};
