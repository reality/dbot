/** 
 * Module Name: Flashy
 * Description: Makes pages with flashing text and that innit.
 */

var _ = require('underscore')._;

var flashy = function(dbot) {
    this.colourMap = {
        'white': 'FFFFFF',
        'red': 'FF0000',
        'green': '00FF00',
        'blue': '0000FF',
        'yellow': 'FFFF00',
        'pink': 'FFC0CB',
        'magenta': 'FF00FF',
        'purple': 'AA00FF',
        'cyan': '00FFFF',
        'orange': 'FFAA00',
        'lime': 'AAFF00',
        'grey': 'AAAAAA',
        'infrared': '000000'
    };

    this.commands = {
        '~flashy': function(event) {
            var colour = event.input[1];
            var text = event.input[2].trim().toUpperCase();

            if(_.has(this.colourMap, colour)) {
                event.reply(dbot.t('url', {
                    'host': dbot.config.web.webHost,
                    'port': dbot.config.web.webPort,
                    'path': 'flashy/' + colour + '/' + encodeURIComponent(text)
                }));
            } else {
                var possibleColours = _.keys(this.colourMap).join(', ') + '.';
                event.reply('No such colour, brah. Available colours are: ' + possibleColours);
            }
        }
    };

    this.commands['~flashy'].regex = [/^~flashy ([^ ]+) (.+)$/, 3];
};

exports.fetch = function(dbot) {
    return new flashy(dbot);
};
