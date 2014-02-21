/**
 * Module Name: 500px
 * Description: Adds various 500px functionality.
 * Requires: node-500px [http://mjgil.github.io/five-px/]
 */

var _ = require('underscore')._,
    API500px = require('500px').API500px;

var fpx = function(dbot) {

	this.internalAPI = {
	
		//gets photo by user, returns a JSON, most likely have to use callback
		'getPhotosByUser' = function(server,nick,callback) {
		
			var fpx_username = null;
			    this.getUser(server,nick,function(user,fpx){
			        if (fpx==null){
			            return;
			        }
			        else{
			            fpx_username=fpx;
			        }
		        });
			
			var username=fpx_username;
			this.api500px.photos.getByUsername(username,{'sort': 'created_at', 'rpp': '100'},  function(error, results) {
                if (error) {
                    event.reply(dbot.t('5px_error'));
                    console.log(error);
                } else {
                    callback(results);
                }
            });
		}
	

        //callback with (user,fpx_username)
		'getUser': function(server, nick, callback) {
            dbot.api.profile.getProfile(server, nick, function(err, user, profile) {
                if(user) {
                    if(profile && _.has(profile.profile, '500px')) {
                        callback(user, profile.profile.500px);
                    } else {
                    	event.reply(user.currentNick + ': Set a 500px username with "~set 500px username"');
                        callback(user, null);
                    }
                } else {
                	event.reply('Unknown user.');
                    callback(null, null);
                }
            });
        }
        
	
	}
	
    this.commands = {
        '~r500px': function(event) {
            var random = Math.floor(Math.random() * 30);
            this.api500px.photos.getPopular({'sort': 'created_at', 'rpp': '30'},  function(error, results) {
                if (error) {
                    event.reply(dbot.t('5px_error'));
                    console.log(error);
                } else {
                    var name = results.photos[random].name,
                        id = results.photos[random].id;
                    event.reply(dbot.t('5px_result',{'name':name,'id':id}));
                }
            });
        },
        
        '~500px': function(event) {
            var user = event.rUser;
            if(event.res[0]) {
                user = event.res[0].user;
            }

		this.internalAPI.getPhotosByUser(event.server,user, function(results) {
			var fpx_name=user.currentNick,
				fpx_photos=results.total_items,
				fpx_id=results.photos[0].user.username;
			event.reply(dbot.t('5px_profile',{'name'=fpx_name,'total'=fpx_photos,'fpx_username'=fpx_id}));
		},
		
		'~last500px':function(event){
		    var user = event.rUser;
                if(event.res[0]) {
                    user = event.res[0].user;
                }
		    this.internalAPI.getPhotosByUser(event.server,user, function(results) {
		    var name = results.photos[0].name,
                id = results.photos[0].id;
                event.reply(dbot.t('5px_result',{'name':name,'id':id}));		
		    });
		}
		
		
		);
        
        },

    };
    this.onLoad = function() {
        this.api500px = new API500px(this.config.api_key);
    }.bind(this);
    
};

exports.fetch = function(dbot) {
    return new fpx(dbot);
};
