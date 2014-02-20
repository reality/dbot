/**
 * Module Name: wolframalpha
 * Description: Calculates all kinds of stuff through Wolfram Alpha.
 * Requires: node-wolfram [https://github.com/strax/node-wolfram]
 */

var _ = require('underscore')._,
	Client = require('node-wolfram');

var wolframalpha = function(dbot) {
    	this.commands = {
        	'~calculate': function(event) {
        		var wolfram = new Client(this.config.appID);
                var query = event.input[1];
                wolfram.query(event.input[1], function(err, result) {
					if(err)
						event.reply(dbot.t('error'));
					else
					{
						var out = "";
						for(var a=0; a<result.queryresult.pod.length; a++)
						{
							var pod = result.queryresult.pod[a];
							out += pod.$.title;
							out +=": ";
								for(var b=0; b<pod.subpod.length; b++)
								{
									var subpod = pod.subpod[b];
									for(var c=0; c<subpod.plaintext.length; c++)
									{
										var text = subpod.plaintext[c];
										console.log('\t', text);
										out += text;
										out += " ; ";
									}
								}
						}
						event.reply(dbot.t('result',{'output':out}));
					}
				});
			}
		};

};

exports.fetch = function(dbot) {
    return new wolframalpha(dbot);
};
