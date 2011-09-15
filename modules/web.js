var express = require('express');

var webInterface = function(dbot) {
    var dbot = dbot;

    var pub = '../public';
    var app = express.createServer();

    app.use(express.compiler({ src: pub, enable: ['sass'] }));
    app.use(express.static(pub));
    app.set('view engine', 'jade');

    app.get('/', function(req, res) {
        res.render('index', { });
    });
    
    app.get('/quotes/:key', function(req, res) {
        if(dbot.db.quoteArrs.hasOwnProperty(req.params.key)) {
            res.render('quotes', { 'quotes': dbot.db.quoteArrs[req.params.key] });
        } else {
            res.render('error', { 'message': 'No quotes under that key.' });
        }
    });

    app.listen(1337);

    return { 
        'onDestroy': function() {
            app.close();
        }
    };
};

exports.fetch = function(dbot) {
    return webInterface(dbot);
};
