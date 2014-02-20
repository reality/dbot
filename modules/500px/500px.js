/**
 * Module Name: 500px
 * Description: Adds various 500px functionality.
 * Requires: node-500px [http://mjgil.github.io/five-px/]
 */

var _ = require('underscore')._,
	API500px = require('500px').API500px,
    api500px = new API500px(this.config.consumerKey);//dependencies

var foo = function(dbot) { //name of module

		this.ApiRoot = 'API_ROOT_HERE';
		
		this.internalAPI = {
        //code for internal api here
		};

		this.api = {
		//code for api here
		};

    	this.commands = {
        	//code for commands here
        	'~r500px':function(){
        	
        		var random = Math.floor(Math.random() * 30);
        		api500px.photos.getPopular({'sort': 'created_at', 'rpp': '30'},  function(error, results) {
    				if (error) {
        				event.reply(dbot.t('error'));
   					} else {
        				// getting photo name and url from results json http://is.gd/hALYmR
        				var 500px_name=results.photos[random].name,
        					500px_id=results.photos[random].id;
        				event.reply(dbot.t('result',{'name':500px_name,'id'=500px_id}));
    				}
				});
        	
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
    return new foo(dbot); //name of module
};
