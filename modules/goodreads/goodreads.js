/**
 * Module Name: GoodReads
 * Description: Various goodreads.
 */

var _ = require('underscore')._,
    request = require('request'),
    async = require('async'),
    moment = require('moment'),
    parseString = require('xml2js').parseString;

var goodreads = function(dbot) {
    this.ApiRoot = 'https://www.goodreads.com/';

    this.internalAPI = {
        'getGoodreads': function(server, nick, callback) {
            dbot.api.profile.getProfile(server, nick, function(err, user, profile) {
                if(user) {
                    if(profile && _.has(profile.profile, 'goodreads')) {
                        callback(user, profile.profile.goodreads);
                    } else {
                        callback(user, null);
                    }
                } else {
                    callback(null, null);
                }
            });
        }
    };

    this.api = {
        'searchBook': function(term, callback) {
            request.get({
                'url': this.ApiRoot + 'search.xml',
                'qs': {
                    'q': term,
                    'key': this.config.api_key
                }
            }, function(err, response, body) {
                if(!_.isUndefined(body) && !err) {
                    parseString(body, function(err, result) {
                        // This is why we don't use XML kids
                        var result = result['GoodreadsResponse'].search[0].results[0];
                        if(_.has(result, 'work')) {
                            callback(null, {
                                'id': result.work[0].best_book[0].id[0]['_'],
                                'title': result.work[0].best_book[0].title[0],
                                'author': result.work[0].best_book[0].author[0].name[0],
                                'rating': result.work[0].average_rating[0] 
                            });
                        } else {
                            callback(true, null);
                        }
                    });
                } else {
                    callback(true, null);
                }
            }.bind(this));
        },

        'getProfile': function(id, callback) {
            request.get({
                'url': this.ApiRoot + 'user/show.xml',
                'qs': {
                    'username': id,
                    'key': this.config.api_key
                }
            }, function(err, response, body) {
                if(!_.isUndefined(body) && !err) {
                    parseString(body, function(err, result) {
                        if(result && _.has(result, 'GoodreadsResponse')) {
                            var shelves = {};
                            result = result['GoodreadsResponse'].user[0].user_shelves[0].user_shelf;
                            _.each(result, function(shelf) {
                                shelves[shelf.name[0]] = shelf.book_count[0]['_'];
                            });
                            callback(null, shelves);
                        } else {
                            callback(true, null);
                        }
                    });
                } else {
                    callback(true, null);
                }
            });
        }
    };

    this.commands = {
        '~book': function(event) {
            this.api.searchBook(event.input[1], function(err, res) {
                if(!err) {
                    event.reply(dbot.t('gr_book', {
                        'author': res.author,
                        'title': res.title,
                        'rating': res.rating,
                        'link': this.ApiRoot + 'book/show/' + res.id
                    }));
                } else {
                    event.reply(dbot.t('gr_nobook'));
                }
            }.bind(this));
        },

        '~books': function(event) {
            var user = event.rUser,
                gr = event.rProfile.goodreads;
            if(event.res[0]) {
                user = event.res[0].user;
                gr = event.res[0].gr;
            }

            this.api.getProfile(gr, function(err, profile) {
                if(!err) {
                    event.reply(dbot.t('gr_books', {
                        'user': user.currentNick,
                        'read': profile.read,
                        'currently_reading': profile['currently-reading']
                    }));
                } else {
                    event.reply(dbot.t('gr_unknown'));
                }
            });
        }
    };
    this.commands['~book'].regex = [/^book ([\d\w\s-]*)/, 2];

    _.each(this.commands, function(command) {
        command.resolver = function(event, callback) {
            if(event.rProfile && _.has(event.rProfile, 'goodreads')) {
                if(event.params[1]) {
                    this.internalAPI.getGoodreads(event.server, event.params[1], function(user, gr) {
                        if(user && gr) {
                            event.res.push({
                                'user': user,
                                'gr': gr  
                            });
                            callback(false); 
                        } else {
                            if(!user) {
                                event.reply('Unknown user.');
                            } else {
                                event.reply(user.currentNick + ': Set a Goodreads username with "~set goodreads username"'); 
                            }
                            callback(true);
                        }
                    });
                } else {
                    callback(false);
                }
            } else {
                event.reply(event.user + ': Set a goodreads username with "~set goodreads username"'); 
                callback(true);
            }
        }.bind(this);
    }, this);

};

exports.fetch = function(dbot) {
    return new goodreads(dbot);
};
