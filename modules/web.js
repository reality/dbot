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
        console.log('test');
    });

    app.listen(1337);
    return { };
};

exports.fetch = function(dbot) {
    return webInterface(dbot);
};
