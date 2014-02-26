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

    this.api = {
        'searchBook': function(term, callback) {
            request.get({
                'url': this.ApiRoot + 'search.xml',
                'qs': {
                    'q': term,
                    'key': this.config.api_key
                }
            }, function(err, response, body) {
                if(!_.isUndefined(body)) {
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
        }
    };
    this.commands['~book'].regex = [/^book ([\d\w\s-]*)/, 2];
};

exports.fetch = function(dbot) {
    return new goodreads(dbot);
};
