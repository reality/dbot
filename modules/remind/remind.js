/** 
 * Module Name: Remind
 * Description: Reminds you
 */

var remind = function(dbot) {
    var self = this;

    this.internalAPI = {
        'getSeconds': function(number,interval) {
            switch(interval) {
                case "d":
                    return number*24*60*60;
                case "h":
                    return number*60*60;
                case "m":
                    return number*60;
                case "s":
                    return number;
            }
        }.bind(this),
        'doReminder': function(event,user,time,message) {
            var now = Date.now();
            var datesplits = time.match(/[0-9]+[dhms]/g);
            if(datesplits == null) {
                event.reply("The time parameter was not a valid time mah boy, it was "+time);
                return;
            }
            var timeinseconds = 0;
            for(var i=0;i<datesplits.length;++i) {
                var number = parseInt(datesplits[i].match(/[0-9]+/)[0]);
                var interval = datesplits[i].match(/[^0-9]/)[0];
                timeinseconds += this.internalAPI.getSeconds(number,interval);
            }
            var then = new Date(now + (timeinseconds*1000));
            if(dbot.config.debugMode) {
                event.reply("The timer will be at "+then);
            }
            var cb = function() {
            if(message) {
                if(event.user === user) {
                    event.reply(user+": This is your reminder. You left a message: "+message);
                } else {
                    event.reply(user+": This is your reminder. "+event.user+" left a message: "+message);
                }
            } else {
                if(event.user === user) {
                    event.reply(user+": This is your reminder. You did not leave a message.");
                } else {
                    event.reply(user+": This is your reminder. "+event.user+" did not leave a message.");
                }
            }
            };
            dbot.api.timers.addTimeout(then,cb,null);
            if(message)
                event.reply("I've set the timer with message "+message);
            else
                event.reply("I've set the timer.");
        }.bind(this)
    };

    this.commands = {
        '~remind': function(event) {
            if(event.params.length < 3) {
                event.reply("You need to give me a user and time dude.");
                return;
            }
            this.internalAPI.doReminder(event,event.params[1],event.params[2],event.params.splice(3, event.params.length-1).join(' ').trim());
        },
        '~remindme': function(event) {
            if(event.params.length < 2) {
                event.reply("You need to give me a time dude.");
                return;
            }
            this.internalAPI.doReminder(event,event.user,event.params[1],event.params.splice(2, event.params.length-1).join(' ').trim());
        }
    };
};

exports.fetch = function(dbot) {
    return new remind(dbot);
};
