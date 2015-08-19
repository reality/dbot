/** 
 * Module Name: Crypto
 * Description: Allows the magic of cryptography to take place.
 */

var cr = require('crypto');

var crypto = function(dbot) {
    this.commands = {
        '~hash': function(event) {
            var hash = event.params[1];
            try {
                var h = cr.createHash(hash);
                var tohash = event.params.splice(2, event.params.length-1).join(' ');
                h.update(tohash);
                event.reply(hash+" of \""+tohash+"\" is: "+h.digest('hex'));
            } catch(err) {
                event.reply(err);
            }
        },
        '~randomdata': function(event) {
            try {
                var count = parseInt(event.params[1]);
                if(count > 222) {
                    event.reply("Sorry man, I can't paste that much random data.");
                    return;
                }
                cr.randomBytes(count, function(err,buf) {
                    if(err) {
                        event.reply(err);
                        return;
                    }
                    event.reply(buf.toString('hex'));
                });
            } catch (err) {
                event.reply(err);
            }
        }
    };
};

exports.fetch = function(dbot) {
    return new crypto(dbot);
};
