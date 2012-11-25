var express = require('express');

var webInterface = function(dbot) {
    var pub = 'public';
    var app = express.createServer();

    app.use(express.compiler({ src: pub, enable: ['sass'] }));
    app.use(express.static(pub));
    app.set('view engine', 'jade');

    app.get('/', function(req, res) {
        res.render('index', { 'name': dbot.name });
    });

    app.get('/connections', function(req, res) {
        var connections = Object.keys(dbot.instance.connections);
        res.render('connections', { 'name': dbot.name, 'connections': connections });
    });

    app.get('/channels/:connection', function(req, res) {
        var connection = req.params.connection;
        if(dbot.instance.connections.hasOwnProperty(connection)) {
            var channels = Object.keys(dbot.instance.connections[connection].channels);
            res.render('channels', { 'name': dbot.name, 'connection': connection, 'channels': channels});
        } else {
            res.render('error', { 'name': dbot.name, 'message': 'No such connection.' });
        }
    });

    app.get('/users/:connection/:channel', function(req, res) {
        var connection = req.params.connection;
        var channel = '#' + req.params.channel;
        var connections = dbot.instance.connections;

        if(connections.hasOwnProperty(connection) && connections[connection].channels.hasOwnProperty(channel)) {
            var nicks = connections[connection].channels[channel].nicks;
            res.render('users', { 'name': dbot.name, 'connection': connection,
                'channel': channel, 'nicks': nicks });
        } else {
            res.render('error', { 'name': dbot.name, 'message': 'No such connection or channel.' });
        }
    });
 
    app.get('/user/:connection/:channel/:user', function(req, res) {
        var connection = req.params.connection;
        var channel = '#' + req.params.channel;
        var user = dbot.cleanNick(req.params.user);

        var quoteCount = 'no';
        if(dbot.db.quoteArrs.hasOwnProperty(user)) {
            var quoteCount = dbot.db.quoteArrs[user].length;
        }

        if(!dbot.db.kicks.hasOwnProperty(user)) {
            var kicks = '0';
        } else {
            var kicks = dbot.db.kicks[user];
        }

        if(!dbot.db.kickers.hasOwnProperty(user)) {
            var kicked = '0';
        } else {
            var kicked = dbot.db.kickers[user];
        }

        res.render('user', { 'name': dbot.name, 'user': req.params.user,
        'channel': channel, 'connection': connection, 'cleanUser': user, 
        'quotecount': quoteCount, 'kicks': kicks, 'kicked': kicked });
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
        if(dbot.db.polls.hasOwnProperty(key) && dbot.db.polls[key].hasOwnProperty('description')) {
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
