/**
 * Module Name: GoodReads
 * Description: Interacts with the GoodReads API to provide book-oriented functionality to dbot
 */

const util = require('util'),
      _ = require('underscore')._,
      rp = require('request-promise-native'),
      parseString = util.promisify(require('xml2js').parseString);
    
const GoodReads = function(dbot) {
    this.apiRoot = 'https://www.goodreads.com';
    
    this.internalAPI = {
        'outputError': (evt, e) => {
            switch(e) {
                case 'goodreads-error': evt.reply('Error talking to GoodReads.'); return;
                case 'book-not-found': evt.reply(dbot.t('gr_nobook')); return;
                case 'no-description': evt.reply('No description was found for the book you asked for.'); return;
                case 'author-not-found': evt.reply(dbot.t('gr_noauthor')); return;
            }
            
            console.log(e);
            evt.reply('Something went wrong and I don\'t know what.');
        },
        
        'formatProfile': profile => {
            var shelves = {};
            _.each(profile.user_shelves.user_shelf, shelf => {
                shelves[shelf.name] = shelf.book_count['_'];
            });
            profile.user_shelves = shelves;
            return profile;
        }
    };
    
    this.api = {
        'findBook': async term => {
            //https://www.goodreads.com/search/index.xml
            const body = await rp({
                uri: this.apiRoot + '/search/index.xml',
                qs: {
                    key: this.config.api_key,
                    q: term.split(' ').join('+')
                }
            });
      
            const response = await parseString(body, { explicitArray: false });
            if(!_.has(response, 'GoodreadsResponse')) throw 'goodreads-error';
            
            const result = response.GoodreadsResponse.search.results;
            if(!result || !_.has(result, 'work')) throw 'book-not-found';
            if(!result.work[0]) throw 'book-not-found';
            
            return {
                id: result.work[0].best_book.id['_'],
                title: result.work[0].best_book.title,
                author: result.work[0].best_book.author.name,
                rating: result.work[0].average_rating
            };
        },
        
        'getSummaryForBook': async id => {
            //https://www.goodreads.com/book/show.xml
            const body = await rp({
                uri: this.apiRoot + '/book/show.xml',
                qs: {
                    key: this.config.api_key,
                    id: id
                }
            });
            
            const response = await parseString(body, { explicitArray: false });
            if(!_.has(response, 'GoodreadsResponse')) throw 'goodreads-error';
            
            const result = response.GoodreadsResponse.book;
            if(!result) throw 'book-not-found';
            if(!_.has(result, 'description')) throw 'no-description';
            
            return result.description;
        },
        
        'findAuthor': async term => {
            //https://www.goodreads.com/api/author_url/<ID>
            const body = await rp({
                url: this.apiRoot + '/api/author_url/' + term,
                qs: {
                    key: this.config.api_key
                }
            });
            
            const response = await parseString(body, {explicitArray: false });
            if(!_.has(response, 'GoodreadsResponse')) throw 'goodreads-error';
            
            const result = response.GoodreadsResponse.author;
            if(!result) throw 'author-not-found';
            
            return {
                id: result['$'].id,
                author: result.name
            };
        },
        
        'getProfileById': async id => {
            //https://www.goodreads.com/user/show.xml
            try {
                var body = await rp({
                    url: this.apiRoot + '/user/show.xml',
                    qs: {
                        key: this.config.api_key,
                        id: id
                    }
                });
            }
            catch (e) {
                if(e.statusCode && e.statusCode == 404) {
                    throw 'user-not-found';
                    return;
                }
                
                throw e;
            }
            
            const response = await parseString(body, { explicitArray: false });
            if(!_.has(response, 'GoodreadsResponse')) throw 'goodreads-error';
            
            const result = response.GoodreadsResponse.user;
            if(!result) throw 'user-not-found';
            
            return this.internalAPI.formatProfile(result);
        },

        'getProfileByName': async username => {
            //https://www.goodreads.com/user/show.xml
            try {
                var body = await rp({
                    url: this.apiRoot + '/user/show.xml',
                    qs: {
                        key: this.config.api_key,
                        username: username
                    }
                });
            }
            catch (e) {
                if(e.statusCode && e.statusCode == 404) {
                    throw 'user-not-found';
                    return;
                }
                
                throw e;
            }
            
            const response = await parseString(body, { explicitArray: false });
            if(!_.has(response, 'GoodreadsResponse')) throw 'goodreads-error';
            
            const result = response.GoodreadsResponse.user;
            if(!result) throw 'user-not-found';
            
            return this.internalAPI.formatProfile(result);
        },
        
        'getShelfForUserId': async (id, shelf) => {
            //https://www.goodreads.com/review/list.xml?v=2
            var body = await rp({
                url: this.apiRoot + '/review/list.xml',
                qs: {
                    v: '2',
                    key: this.config.api_key,
                    id: id,
                    shelf: shelf
                }
            });
            
            const response = await parseString(body, { explicitArray: false });
            if(!_.has(response, 'GoodreadsResponse')) throw 'goodreads-error';
            
            let result = response.GoodreadsResponse.reviews.review;
            if(!result) return [];
            
            if(!_.isArray(result)) {
                result = [result];
            }
            
            return _.map(result, r => {
                return {
                    id: r.book.id['_'],
                    title: r.book.title_without_series
                };
            });
        }
    };
    
    this.commands = {
        '~book' : async evt => {
            try {
                const book = await this.api.findBook(evt.input[1]);
                evt.reply(dbot.t('gr_book', {
                    author: book.author,
                    title: book.title,
                    rating: book.rating,
                    link: this.apiRoot + '/book/show/' + book.id
                }));
            }
            catch(e) { this.internalAPI.outputError(evt, e); }
        },
        
        '~booksummary': async evt => {
            try {
                console.log(evt.input[1]);
                const book = await this.api.findBook(evt.input[1]);
                const summary = await this.api.getSummaryForBook(book.id);
                evt.reply(dbot.t('gr_summary', {
                    title: book.title,
                    summary: summary,
                    link: this.apiRoot + '/book/show/' + book.id
                }));
            }
            catch(e) { this.internalAPI.outputError(evt, e); }
        },
        
        '~author' : async evt => {
            try {
                evt.reply(dbot.t('gr_author', await this.api.findAuthor(evt.input[1])));
            }
            catch(e) { this.internalAPI.outputError(evt, e); }
        },
        
        '~reading': async (evt, profile) => {
            try {
                let books = await this.api.getShelfForUserId(profile.id, 'currently-reading');
                const booksCount = books.length;
                if(!booksCount) {
                    evt.reply(dbot.t('gr_not_reading', { user: evt.rUser.currentNick }));
                    return;
                }
                
                let tooMany = booksCount > 5;
                if (tooMany) books = _.sample(books, 5);
                
                evt.reply(dbot.t('gr_is_reading', { user: evt.rUser.currentNick, count: booksCount }));
                _.each(books, b => {
                    evt.reply(ostr = b.title + ' - https://www.goodreads.com/book/show/' + b.id);
                });
                
                if (tooMany) {
                    evt.reply('... And ' + (booksCount - 5) + ' more - https://www.goodreads.com/review/list/' + profile.id + '?shelf=currently-reading');
                }
            }
            catch(e) { this.internalAPI.outputError(evt, e); }
        }
    };
    
    this.commands['~book'].regex = [/^book (.*)/, 2];
    this.commands['~booksummary'].regex = [/^booksummary (.*)/, 2];
    this.commands['~author'].regex = [/^author ([\d\w\s-]*)/, 2];
    
    this.commands['~reading'].requiresProfile = true;
    
    _.each(this.commands, ((cmd, cmdName) => {
        if(cmd.requiresProfile) {
            this.commands[cmdName] = (async evt => {
                const grUsername = evt.rProfile.goodreads;
                
                if(!grUsername) {
                    evt.reply(evt.rUser.currentNick + ': Set a Goodreads username with "~set goodreads username"');
                    return;
                }
                
                let grId = evt.rProfile.goodreads_id;
                
                try {
                    var profile;
                    if(grId) {
                        profile = await this.api.getProfileById(grId);
                    } else {
                        profile = await this.api.getProfileByName(grUsername);
                        grId = profile.id;
                        dbot.api.profile.setProperty(evt.server, evt.user, 'goodreads_id', grId, function(){});
                    }

                    await cmd(evt, profile);
                }
                catch(e) {
                    if(e === 'user-not-found') evt.reply('User not found. Is your GoodReads username set correctly?');
                    else this.internalAPI.outputError(evt, e);
                }
            }).bind(this);
        }
    }).bind(this))
    
}


exports.fetch = dbot => new GoodReads(dbot);