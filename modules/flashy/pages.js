var _ = require('underscore')._;

var pages = function(dbot) {
    return {
        '/flashy/:colour/:text': function(req, res) {
            if(!_.has(this.colourMap, req.params.colour)) {
                req.params.colour = 'red'; 
            }
            var colour = this.colourMap[req.params.colour];
            res.render('flashy', {
                'name': dbot.config.name,
                'colour': colour,
                'text': decodeURIComponent(req.params.text)
            });
        }
    };
};

exports.fetch = function(dbot) {
    return pages(dbot);
};
