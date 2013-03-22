/**
 * Module Name: DNS 
 * Description: Performs and reports on basic DNS functions.
 */
var dnsmod = require('dns');

var dns = function(dbot) {
    var commands = {
        '~lookup': function(event) {
            domain = event.params[1];
            dnsmod.lookup(domain, function (error, addr) {
                if (error) {
                    console.log(error);
                    event.reply(dbot.t("lookup-error",{"domain": domain, "code": error.code}));
                } else {
                    event.reply(dbot.t("lookup",{"domain": domain, "address": addr}));
                }
            });
        },
        '~rdns': function(event) {
            ip = event.params[1];
            try {
                dnsmod.reverse(ip, function (error, domain) {
                    if (error) {
                        throw error;
                    }
                    event.reply(dbot.t("rdns",{"domain": domain, "ip": ip}));
                });
            } catch (err) {
                    event.reply(dbot.t("rdns-error",{"domain": domain, "ip": ip, "error": err}));
            }
        }
            
    };
    this.commands = commands;

    this.on = 'PRIVMSG';
};

exports.fetch = function(dbot) {
    return new dns(dbot);
};
