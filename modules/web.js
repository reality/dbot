var express = require('express');

var webInterface = function(dbot) {
    var dbot = dbot;

    var pub = 'public';
    var app = express.createServer();

    app.use(express.compiler({ src: pub, enable: ['sass'] }));
    app.use(express.static(pub));
    app.set('view engine', 'jade');

    app.get('/', function(req, res) {
        res.redirect('/quotes');
        //res.render('index', { });
    });
    
    app.get('/quotes', function(req, res) {
        // Lists the quote categories
        res.render('quotelist', { 'quotelist': Object.keys(dbot.db.quoteArrs) });
    });
    
    app.get('/quotes/:key', function(req, res) {
        // Lists the quotes in a category
        var key = req.params.key.toLowerCase();
        if(dbot.db.quoteArrs.hasOwnProperty(key)) {
            res.render('quotes', { 'quotes': dbot.db.quoteArrs[key], locals: {url_regex: RegExp.prototype.url_regex()}});
        } else {
            res.render('error', { 'message': 'No quotes under that key.' });
        }
    });
    
    app.listen(443);

    return { 
        'onDestroy': function() {
            app.close();
        }
    };
};

exports.fetch = function(dbot) {
    return webInterface(dbot);
};
