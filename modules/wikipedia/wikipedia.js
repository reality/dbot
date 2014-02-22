/**
 * Module Name: wikipedia
 * Description: Adds various wikipedia functionalities.
 * Requires: WikiJs [https://github.com/rompetoto/wiki]
 */

var _ = require('underscore')._,
	Wiki = require('wikijs');//dependencies

var wikipedia = function(dbot) { //name of module

    	this.commands = {
        	//code for commands here
        	'~wiki':funtion(event){
        		var query = event.input[1];
        		Wiki.search(query, 1, function(err, results){
    				// results = ['Joker (comics)', 'Joker (comic book)', 'DC Comics']
    				if(err){
    				event.reply(dbot.t('wiki_error'));
    				console.log(err);
    				}
    				else{
    					Wiki.page(results[0], function(err, page){
    					// page = WikiPage object for results[0] article
    						var wiki_name=results[0],
    							wiki_summary=page.summary;
    						event.reply(dbot.t('wiki_result',{'name':wiki_name,'summary':wiki_summary}));
						});
    				}
				});
        	},
        	'~rwiki':function(event){
			Wiki.random(function(err, results){
    			// results = ['Star Wars']
    			if (err){
    			event.reply(dbot.t('error'));
    			}
    			else{
    				Wiki.page(results[0], function(err, page){
    					// page = WikiPage object for results[0] article
    					var wiki_name=results[0],
    						wiki_summary=page.summary;
    					event.reply(dbot.t('wiki_result',{'name':wiki_name,'summary':wiki_summary}));
					});
    			}
			});
        	
			}
		};
    }

};

exports.fetch = function(dbot) {
    return new wikipedia(dbot); //name of module
};
