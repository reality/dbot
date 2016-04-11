/**
 * Module Name: DNS 
 * Description: Performs and reports on basic DNS functions.
 */
var dnsm = require('dns'),
    request = require('request'),
    http = require('http');

var dns = function(dbot) {
    if(!_.has(dbot.db, 'ip')) {
      dbot.db.ip = {};
    }
    var ips = dbot.db.ip;

    this.api = {
      'getGeoIp': function(ip, callback) {
        if(_.has(ips, ip)) {
            body = ips[ip];
            callback(ip + ' is located in '+ body.city + ', ' + body.country + '. Hostname: ' + body.hostname + '. ISP: ' + body.org);
          } else {
            request.get('http://ipinfo.io/'+ip, {
              'json': true 
            }, function(err, res, body) {
              if(!err && body) {
                  callback(ip + ' is located in '+ body.city + ', ' + body.country + '. Hostname: ' + body.hostname + '. ISP: ' + body.org);
                } else {
                  callback('No info about ' + ip);
                }
                ips[ip] = body;
            });
          }
      }.bind(this)
    };

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
          this.api.getGeoIp(ip, function(result) { event.reply(result); });    
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
          dbot.say(event.server, '#dnsbl', 'DEBUG: Looking up ' + ip[2] + ' for ' + ip[1] + ' @ ' + revIp);
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
