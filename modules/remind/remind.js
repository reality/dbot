/** 
 * Module Name: Remind
 * Description: Reminds you
 */

var crypto = require('crypto');

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
            this.internalAPI.startTimer(event.server,event.channel,then,event.user,user,message);
            this.internalAPI.saveTimer(event.server,event.channel,then,event.user,user,message);
            if(message)
                event.reply("I've set the timer with message "+message);
            else
                event.reply("I've set the timer.");
        }.bind(this),
        'startTimer': function(server, channel, time, starter, target, message) {
            dbot.say(server,channel,"startTimer called!");
            var cb = function() {
                if(message) {
                    if(starter === target) {
                        dbot.say(server,channel,target+": This is your reminder. You left a message: "+message);
                    } else {
                        dbot.say(server,channel,target+": This is your reminder. "+starter+" left a message: "+message);
                    }
                } else {
                    if(starter === target) {
                        dbot.say(server,channel,target+": This is your reminder. You did not leave a message.");
                    } else {
                        dbot.say(server,channel,target+": This is your reminder. "+starter+" did not leave a message.");
                    }
                }
                dbot.say(server,channel,"REMOTE THE FUCKING TIMER NOW!");
            };
            dbot.api.timers.addTimeout(time,cb,null);
            dbot.say(server,channel,"Timer queued for "+time);
        }.bind(this),
        'saveTimer': function(server,channel,time,starter,target,message) {
            var hash = this.internalAPI.getHashForTime(time);
            dbot.db.remindTimers[hash] = {server:server, channel:channel.name, time:time.valueOf(), starter:starter, target:target, message:message};
        }.bind(this),
        'getHashForTime': function(time) {
            var md5 = crypto.createHash('md5');
            console.log(time.valueOf().toString());
            md5.update(time.valueOf().toString());
            return hash = md5.digest('hex');
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

    this.onLoad = function() {
        if(!dbot.db.remindTimers) {
            dbot.say("tripsit","#epow0","dbot.db.remindTimers is "+dbot.db.remindTimers);
            dbot.db.remindTimers = {};
            return;
        }
        dbot.say("tripsit","#epow0","dbot.db.remindTimers has length "+Object.keys(dbot.db.remindTimers).length);
        for(var i=0;i<Object.keys(dbot.db.remindTimers).length;++i) {
            dbot.say("tripsit","#epow0","Found saved timer "+Object.keys(dbot.db.remindTimers)[i]);
            var prop = dbot.db.remindTimers[Object.keys(dbot.db.remindTimers)[i]];
            dbot.say("tripsit","#epow0","I will pass: prop.server "+prop.server+" prop.channel "+prop.channel+" prop.time "+prop.time+" prop.starter "+prop.starter+" prop.target "+prop.target+" prop.message "+prop.message);
            if(parseInt(prop.time) < Date.now().valueOf()) {
                dbot.say("tripsit","#epow0","This timer is old I shall delete it.");
                delete dbot.db.remindTimers[Object.keys(dbot.db.remindTimers)[i]];
                continue;
            }
            this.internalAPI.startTimer(prop.server,prop.channel,prop.time,prop.starter,prop.target,prop.message);
        }
    };
};

exports.fetch = function(dbot) {
    return new remind(dbot);
};
