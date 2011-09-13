var express = require('express');
var app = express.createServer();
var pub = '../public';

app.use(express.compiler({ src: pub, enable: ['sass'] }));
app.use(express.static(pub));
app.set('view engine', 'jade');

var webInterface = function(dbot) {
    var dbot = dbot;

    app.get('/', function(req, res) {
        res.render('index', { });
    });

    app.listen(1337);
    
    return { };
};

exports.fetch = function(dbot) {
    return webInterface(dbot);
};
