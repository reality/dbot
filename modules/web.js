var express = require('express');

var webInterface = function(dbot) {
    var pub = 'public';
    var app = express.createServer();

    app.use(express.compiler({ src: pub, enable: ['sass'] }));
    app.use(express.static(pub));
    app.set('view engine', 'jade');

    app.get('/', function(req, res) {
        //res.redirect('/quotes');
        res.render('index', { 'name': dbot.name });
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

    // Lists all of the polls
    app.get('/polls', function(req, res) {
        res.render('polllist', { 'name': dbot.name, 'polllist': Object.keys(dbot.db.polls) });
    });

    // Shows the results of a poll
    app.get('/polls/:key', function(req, res) {
        var key = req.params.key.toLowerCase();
        if(dbot.db.polls.hasOwnProperty(key)) {
            // tally the votes
            var totalVotes = 0;
            for( var v in dbot.db.polls[key].votes ) {
                var N = Number(dbot.db.polls[key].votes[v]);
                if( !isNaN(N) ) {
                    totalVotes += N;
                }
            }
            res.render('polls', { 'name': dbot.name, 'description': dbot.db.polls[key].description, 'votees': Object.keys(dbot.db.polls[key].votees), 'options': dbot.db.polls[key].votes, locals: { 'totalVotes': totalVotes, 'url_regex': RegExp.prototype.url_regex() } });
        } else {
            res.render('error', { 'name': dbot.name, 'message': 'No polls under that key.' });
        }
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
