var Wordnik = require('wordnik'),
    parseString = require('xml2js').parseString;

var words = function(dbot) {
    this.commands = {
        '~define': function(event) {
            var query = event.params[1];
            this.wn.definitions(encodeURIComponent(query), function(err, defs) {
                if(!err && defs[0]) {
                    event.reply(dbot.t('def', {
                        'word': query,
                        'definition': defs[0].text
                    }));
                } else {
                    event.reply(dbot.t('no_def', { 'word': query }));
                }
            });
        },

        '~like': function(event) {
            var query = event.params[1];
            this.wn.word(query, {}, function(err, word) {
                if(!err && word) {
                    word.related({
                        'limit': 10
                    }, function(err, related) {
                        if(related[0]) {
                            event.reply(dbot.t('def', {
                                'word': 'Words related to ' + query,
                                'definition': related[0].words.join(', ') + '.'
                            }));
                        } else {
                            event.reply(dbot.t('no_similar', { 'word': query }));
                        }
                    });
                } else {
                    event.reply(dbot.t('no_word', { 'word': query }));
                }
            });
        },

        '~example': function(event) {
            var query = event.params[1];
            this.wn.word(query, {}, function(err, word) {
                if(!err && word) {
                    word.topExample({}, function(err, example) {
                        if(!err && example) {
                            var rep = new RegExp(query, 'g');
                            event.reply(dbot.t('def', {
                                'word': query + ' example',
                                'definition': example.text.replace(rep, '\u00033'+query+'\u000f')
                            }));
                        } else {
                            event.reply(dbot.t('no_example', { 'word': query }));
                        }
                    });
                } else {
                    event.reply(dbot.t('no_word', { 'word': query }));
                }
            });
        },

        '~rw': function(event) {
           this.wn.randomWord(function(err, word) {
                if(!err && word) {
                    this.wn.definitions(encodeURIComponent(word.word), function(err, defs) {
                        if(!err && defs[0]) {
                            if(defs[0].text.match(/plural/i)) {
                                event.reply(dbot.t('def', {
                                    'word': word.word,
                                    'definition': defs[0].text
                                }));
                            } else {
                                dbot.commands['rw'](event);
                            }
                        } else {
                            event.reply(dbot.t('no_def', { 'word': query }));
                        }
                    }.bind(this));
                }
           }.bind(this));
        },

        '~etymology': function(event) {
            var query = event.params[1];
            this.wn.word(query, {}, function(err, word) {
                if(!err && word) { 
                    word.etymologies({},function(err, origin) {
                        if(!err && origin[0]) {
                            parseString(origin[0], function(err, string) {
                                event.reply(dbot.t('origin', {  
                                    'word': query,
                                    'origin': string.ety._
                                }));
                            });
                        } else {
                            event.reply(dbot.t('no_def', { 'word': query }));
                        }
                    });
                } else {
                    event.reply(dbot.t('no_word', { 'word': query }));
                }
            });
        },
        
        '~jimble': function(event) { 
            event.reply(event.params[1].split('').sort(function() { 
                return (Math.round(Math.random()) - 0.5);
            }).join(''));  
        } 
    };
    this.commands['~jimble'].regex = [/^jimble (.+)$/, 2];

    this.onLoad = function() {
        this.wn = new Wordnik({
            'api_key': this.config.api_key
        });
    }.bind(this);
};

exports.fetch = function(dbot) {
    return new words(dbot);
};
