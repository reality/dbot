/**
 * Module Name: Admin
 * Description: Set of commands which only one who is a DepressionBot
 * administrator can run - as such, it has its own command execution listener.
 */
var fs = require('fs'),
    _ = require('underscore')._;

var admin = function(dbot) {
    this.name = 'admin';
    this.ignorable = false;
};

exports.fetch = function(dbot) {
    return new admin(dbot);
};
