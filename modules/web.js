var express = require('express');

var webInterface = function(dbot) {
    var pub = 'public';
    var app = express.createServer();

    app.use(express.compiler({ src: pub, enable: ['sass'] }));
    app.use(express.static(pub));
    app.set('view engine', 'jade');

    app.get('/', function(req, res) {
        res.redirect('/quotes');
        //res.render('index', { });
    });
    
    // Lists the quote categories
    app.get('/quotes', function(req, res) {
        res.render('quotelist', { 'name': dbot.name, 'quotelist': Object.keys(dbot.db.quoteArrs) });
    });
    
    // Lists quotes in a category
    app.get('/quotes/:key', function(req, res) {
        var key = req.params.key.toLowerCase();
        if(dbot.db.quoteArrs.hasOwnProperty(key)) {
            res.render('quotes', { 'name': dbot.name, 'quotes': dbot.db.quoteArrs[key], locals: { 'url_regex': RegExp.prototype.url_regex() } });
        } else {
            res.render('error', { 'name': dbot.name, 'message': 'No quotes under that key.' });
        }
    });

    // Load random quote category page
    app.get('/rq', function(req, res) {
        var rCategory = Object.keys(dbot.db.quoteArrs).random();
        res.render('quotes', { 'name': dbot.name, 'quotes': dbot.db.quoteArrs[rCategory], locals: { 'url_regex': RegExp.prototype.url_regex() } });
    });
    
    app.listen(dbot.webPort);

    return { 
        'name': 'web',
        'ignorable': false,

        'onDestroy': function() {
            app.close();
        }
    };
};

exports.fetch = function(dbot) {
    return webInterface(dbot);
};
