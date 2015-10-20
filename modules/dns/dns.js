/**
 * Module Name: DNS 
 * Description: Performs and reports on basic DNS functions.
 */
var dnsm = require('dns'),
    request = require('request');

var dns = function(dbot) {
    var commands = {
        '~lookup': function(event) {
            domain = event.params[1];
            dnsm.lookup(domain, function (error, addr) {
                if (error) {
                    event.reply(dbot.t("lookup-error",{"domain": domain, "code": error.code}));
                } else {
                    event.reply(dbot.t("lookup",{"domain": domain, "address": addr}));
                }
            });
        },

        '~rdns': function(event) {
            ip = event.params[1];
            dnsm.reverse(ip, function (error, domain) {
                if (error) {
                    event.reply(dbot.t("rdns-error",{"domain": domain, "ip": ip, "error": error.code}));
                } else {
                    event.reply(dbot.t("rdns",{"domain": domain, "ip": ip}));
                }
            });
        },

        '~geoip': function(event) {
            var ip = event.params[1];
            request.get('http://www.telize.com/geoip/'+ip, {
                'json': true
            }, function(err, response, body) {
                if(!err && body && !_.has(body, 'code')) {
                    event.reply(ip + ' is located in '+ body.postal_code + ', ' + body.city + ', ' + body.country + ' and is hosted by ' + body.isp);
                } else {
                    event.reply('No info about ' + ip);
                }
            });
        },

        '~dnsbl': function(event) {
          var revIp = event.input[1].trim().split('.').reverse().join('.');
          dnsm.lookup(revIp + '.cbl.abuseat.org', function(err, res) {
            if(!err && res) {
              event.reply(event.input[1] + ' is listed as an abusive IP.');
            } else {
              event.reply(event.input[1] + ' does not seem to be a Naughty Nancy.');
            }
          });
        }
    };
    commands['~dnsbl'].regex = [/^dnsbl ([\d\w\s\.-]*)/, 2];
    this.commands = commands;

    if(dbot.config.modules.dns.dnsblconn == true) {
      this.listener = function(event) {
        if(event.message.match('CLICONN')) {
          var ip = event.message.match('CLICONN ([^ ]+).*?((?:[0-9]{1,3}\.){3}[0-9]{1,3}) users');
              revIp = ip[2].trim().split('.').reverse().join('.');
          dnsm.lookup(revIp + '.cbl.abuseat.org', function(err, res) {
            if(!err && res) {
              dbot.say(event.server, '#dnsbl', 'ALERT: ' + ip[1] + ' connecting from ' + ip[2] + ' may well be NAUGHTY.');
            }
          });
        }
      }
      this.on = 'NOTICE';
    }
};

exports.fetch = function(dbot) {
    return new dns(dbot);
};
