/** 
 * Module Name: Flashy
 * Description: Makes pages with flashing text and that innit.
 */

var _ = require('underscore')._;

var flashy = function(dbot) {
    this.colourMap = {
        'red': 'FF0000',
        'green': '00FF00',
        'blue': '0000FF'
    };

    this.commands = {
        '~flashy': function(event) {
            var colour = event.input[1];
            var text = event.input[2];

            if(_.has(this.colourMap, colour)) {
                dbot.t('url', {
                    'host': dbot.config.web.webHost,
                    'port': dbot.config.web.webPort,
                    'path': 'flashy/' + colour + '/' + encodeURIComponent(text)
                });
            } else {
                event.reply('no such colour brah');
            }
        }
    };

    this.commands['~flashy'].regex = [/^~flashy ([\d\w-]+[\d\w\s-]*)[ ]?=[ ]?(.+)$/, 3];
};

exports.fetch = function(dbot) {
    return new flashy(dbot);
};
