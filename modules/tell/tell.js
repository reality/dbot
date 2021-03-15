/**
 * Module name: tell
 * Description: tell people things when they r next about
 */

var _ = require('underscore')._,
   request = require('request');

var tell = function(dbot) {
  if(!_.has(dbot.db, 'tells')) {
    dbot.db.tells = {};
  }
  var tells = dbot.db.tells;

  this.commands = {
    'tell': function(event) {
      var target = event.input[1],
          message = event.input[2];

      dbot.api.users.resolveUser(event.server, target, function(err, user) {
        if(!err && user) {
          if(!_.has(tells, user.id)) {
            tells[user.id] = [];
          }

          if(_.any(tells[user.id], function(it) { return it.from == event.user; })) {
            return event.reply('Don\'t be a Repetitious Reginald - you can only leave one message for ' + target + '!');
          } else if(user.id == event.rUser.id) {
            return event.reply('Take a long look in the mirror mate, that\'s you');
          }

          tells[user.id].push({
            'channel': event.channel.name,
            'message': event.message,
            'from': event.user
          }); // i feel like i'm data structure challenged today
          event.reply(event.user + ': I will probably relay your message to ' + target + ' when I see them in this channel next');
        } else {
          event.reply('no idea who that is mate');
        }
      });
    },
    'ctells': function(event) { // from mokay: i disgust me too
      //console.log(tells);
      var found_tells = false;
      for(var attr in tells){
        for (var attr2 in tells[attr]){
          if (tells[attr][attr2]["from"] == event.user){
            found_tells = true;
            tells[attr].splice(attr2, 1);
            //console.log(tells);
          }
        }
      }
      if (found_tells == false){
        event.reply(event.user + ": no tells found for your username");
      } else if (found_tells == true){
         event.reply(event.user + ": all tells removed from your username");
      }
    }
  }
  this.commands.tell.regex = [/tell ([^ ]+) (.+)/, 3];

  this.listener = function(event) {
    if(_.has(tells, event.rUser.id)) {
      var done = [];
      _.each(tells[event.rUser.id], function(tell, i) {
        if(event.channel.name == tell.channel) {
          event.reply('Dear ' + event.user + ', ' + tell.from + ' left you a message: ' + tell.message); 
          tells[event.rUser.id].splice(i, 1);
        }
      }); // i disgust me
      tells[event.rUser.id] = _.without(tells[event.rUser.id], done);
    }
  }.bind(this);
  this.on = 'PRIVMSG';
};

exports.fetch = function(dbot) {
    return new tell(dbot);
};
