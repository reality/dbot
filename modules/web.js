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
        var key = req.params.key.toLowerCase();
        if(dbot.db.quoteArrs.hasOwnProperty(key)) {
            res.render('quotes', { 'quotes': dbot.db.quoteArrs[key] });
        } else {
            res.render('error', { 'message': 'No quotes under that key.' });
        }
    });

    app.get('/quotes/', function(req, res) {
        res.render('quotelist', { 'quotes': Object.keys(dbot.db.quoteArrs) });
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
