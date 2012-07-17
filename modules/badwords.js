/**
 * Module Name: Badwords
 * Description: Remembers how long it has been since someone said a bad word.
 * Author: Sam Clements
 */

var badwords = function(dbot) {
	if(!dbot.db.hasOwnProperty("badwords")) {
		dbot.db.badwords = {};
	}
	
	// Get the arguments for a command
	var get_args = function (event) {
		var word, channel;
		
		// Get the word,
		// and reply with an error message if no word has been given.
		if (event.params.length > 1) {
			word = event.params[1].trim().toLowerCase();
		} else {
			// The word is missing
			return false;
		}
		
		// Get the channel, defaulting to the current channel
		if (event.params.length > 2) {
			channel = event.params[2].trim().toLowerCase();
		} else {
			channel = event.channel;
		}
		
		return {'word': word, 'channel': channel};
	};
	
	var commands = {
		'~badword': function (event) {
			// Ignore non-admins
			if(!dbot.admin.include(event.user)) { return; }
			
			// Get the commands args
			var args = get_args(event);
			if (!args) { return event.reply(dbot.t("syntax_error", {})); }
			
			// Create a badwords list for the channel
			// if one does not exist
			if (!dbot.db.badwords.hasOwnProperty(args.channel)) {
				dbot.db.badwords[args.channel] = {};
			}
			
			// The badwords list for the channel
			var list = dbot.db.badwords[args.channel];
			
			// Dict to format into the reply string
			var format = ;
			
			// Try and add the bad word,
			// checking if it has already been added first
			if (!list.hasOwnProperty(args.word)) {
				// Add the badword
				list[args.word] = {
					// The last time the word was said
					'last': false,
					// The time the word was added to the list
					'starttime': Date.now(),
					// The number of times the word has been said
					'count': 0,
					// The nicks that have said the badword
					'nicks': {},
				};
				
				// Tell the user the badword has been added
				event.reply(dbot.t("badword_added", {
					'word': args.word, 
					'channel': args.channel
				}));
			} else {
				// Tell the user the badword already exists
				/*
				event.reply(dbot.t("badword_error", {
					'word': args.word,
					'channel': args.channel
				}));
				*/
				
				// Show word stats
				var word = list[args.word];
				event.reply(dbot.t("badword_stats", {
					'word':  args.word,
					'count': word.count,
					'starttime':  word.starttime,
					'last': word.last,
				}));
			}
		},
		
		'~badwordrm': function (event) {
			// Ignore non-admins
			if(!dbot.admin.include(event.user)) { return; }
			
			// Get the commands args
			var args = get_args(event);
			if (!args) { return event.reply(dbot.t("syntax_error", {})); }
			
			// If the channel has a badwords list and the word to remove is in it...
			if (dbot.db.badwords.hasOwnProperty(args.channel) & dbot.db.badwords[args.channel].hasOwnProperty(args.word)) {
				// ...delete the badword
				delete dbot.db.badwords[args.channel][args.word];
				
				// If the channel list is now empty...
				if (dbot.db.badwords[args.channel].length == 0) {
					// ...delete it.
					delete dbot.db.badwords[args.channel];
				}
				
				// Tell the user the badword has been removed
				event.reply(dbot.t("badword_removed", {'word': args.word, 'channel': args.channel}));
			} else {
				// Tell the user the badword does not exist
				event.reply(dbot.t("badword_none", {'word': args.word, 'channel': args.channel}));
			}
		},
	};
	
	// The time in minutes since a given time
	var time_since = function (time) {
		return Math.round((Date.now() - time) / 1000 / 60);
	};
	
	var listener = function (event) {
		// Ignore the message if it starts with '~badword'
		if (event.message.indexOf("~badword") == 0) {
			return;
		}
		
		// If there is a badwords list for this channel...
		if (dbot.db.badwords.hasOwnProperty(event.channel)) {
			// ...check the message for each word.
			var channel = dbot.db.badwords[event.channel];
			var line = event.message.toLowerCase();
			
			for (var badword in channel) {
				// If a word is in the message...
				if (channel.hasOwnProperty(badword) & line.indexOf(badword) != -1) {
					word = channel[badword];
					
					// ...tell the user how awful they are...
					if (word.last == false) {
						// The word has not been said before
						event.reply(dbot.t("badword_said_first", {'user': event.user}));
					} else {
						// The user has said this before
						if (word.nicks.hasOwnProperty(event.user)) {
							event.reply(dbot.t("badword_said_user", {
								'user': event.user,
								'time_since': time_since(word.last),
								'time_since_user': time_since(word.nicks[event.user].last),
								'word': badword,
							}));
						// The user has not said this before
						} else {
							event.reply(dbot.t("badword_said", {
								'user': event.user,
								'time_since': time_since(word.last),
								'word': badword,
							}));
						}
					}
					
					// ...update it with the current time...
					word.last = Date.now();
					// ...and increment the count for that word and nick.
					word.count = word.count + 1;
					
					// Remeber who said it
					if (!word.nicks.hasOwnProperty(event.user)) {
						// The user has not said it before
						// Set their count to 1
						word.nicks[event.user] = {'count': 1, 'last': Date.now()};
					} else {
						// The user has said it before,
						// increment their count
						word.nicks[event.user].count += 1;
						word.nicks[event.user].last = Date.now();
					}
				}
			}
		}
	};
	
    return {
        'name': 'badwords',
        'ignorable': false,
		'commands': commands,
        'listener': listener,
        'on': 'PRIVMSG'
    };
}

exports.fetch = function(dbot) {
    return badwords(dbot);
};
