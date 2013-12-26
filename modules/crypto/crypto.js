/** 
 * Module Name: Crypto
 * Description: Allows the magic of cryptography to take place.
 */

var MD5 = require('crypto-js/md5');
var SHA1 = require('crypto-js/sha1');
var SHA256 = require('crypto-js/sha256');
var SHA512 = require('crypto-js/sha512');
var AES = require('crypto-js/aes');

var crypto = function(dbot) {
    this.commands = {
        '~md5': function(event) {
            event.reply("MD5 hash of "+event.input[1]+" is: "+MD5(event.input[1]));
        },
        '~sha1': function(event) {
            event.reply("SHA1 hash of "+event.input[1]+" is: "+SHA1(event.input[1]));
        },
        '~sha256': function(event) {
            event.reply("SHA256 hash of "+event.input[1]+" is: "+SHA256(event.input[1]));
        },
        '~aes': function(event) {
            event.reply("AES of "+event.input[1]+" is: "+AES.encrypt(event.input[1],event.input[2]));
        }
    };

    this.commands['~md5'].regex = /^~md5 ([^ ]+)$/;
    this.commands['~sha1'].regex = /^~sha1 ([^ ]+)$/;
    this.commands['~sha256'].regex = /^~sha256 ([^ ]+)$/;
    this.commands['~aes'].regex = /^~aes "(.*)" "(.*)"$/;
};

exports.fetch = function(dbot) {
    return new crypto(dbot);
};
