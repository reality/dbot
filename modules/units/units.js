/**
 * Module Name: Unit Conversion
 * Description: Converts units.
 * Requires: node-units [https://github.com/brettlangdon/node-units]
 * TODO: currency converting
 */

var _ = require('underscore')._,
    unit = require('node-units');

var units = function(dbot) {
    	this.commands = {
        	'~convert': function(event) {
                var query = event.input[1];
                try {
                    event.reply(dbot.t('result', {
                        'input': query,
                        'output': result
                    }));
                    var result = unit.convert(query);
                }
            } catch (e) {
                event.reply(dbot.t('error'));
            }

        }
    };

};

exports.fetch = function(dbot) {
    return new units(dbot);
};
