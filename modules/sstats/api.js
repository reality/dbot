var _ = require('underscore')._,
    databank = require('databank');

var api = function(dbot) {
    var api = {
        'getUserStats': function(id, callback) {
            this.db.read('user_stats', id, function(err, uStats) {
                callback(uStats); 
            });
        },

        'createUserStats': function(id, callback) {
            var uStats = {
                'id': id,
                'lines': 0,
                'words': 0,
                'capitals': 0,
                'curses': 0,
                'channels': {},
                'creation': new Date().getTime()
            };
            this.db.save('user_stats', id, uStats, function(err, uStats) {
                callback(uStats); 
            });
        },

        'getChannelStats': function(id, callback) {
            this.db.read('channel_stats', id, function(err, cStats) {
                callback(cStats);
            });
        },

        'createChannelStats': function(id, callback) {
            var cStats = {
                'id': id,
                'lines': 0,
                'words': 0,
                'capitals': 0,
                'curses': 0,
                'creation': new Date().getTime()
            };
            this.db.save('channel_stats', id, cStats, function(err, cStats) {
                callback(cStats);
            });
        },

        'createTrackedWord': function(word, callback) {
            var tWord = {
                'word': word,
                'total': 0,
                'channels': {},
                'users': {},
                'creation': new Date().getTime()
            };
            this.db.save('tracked_words', word, tWord, function(err, tWord) {
                callback(tWord);
            });
        },

        'getTrackedWord': function(word, callback) {
            this.db.read('tracked_words', word, function(err, tWord) {
                callback(tWord);
            });
        }
    };

    return api;
};

exports.fetch = function(dbot) {
    return api(dbot);
};
