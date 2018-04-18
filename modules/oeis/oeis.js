/**
 * Module Name: oeis
 * Description: Interacts with the Online Encyclopedia of Integer Sequences
 *              API to provide integer sequence lookups and related information
 */

var rp = require('request-promise-native');

var OEIS = function(dbot) {
    this.apiRoot = 'https://oeis.org/search';
    this.webRoot = 'https://oeis.org/';
    
    this.internalAPI = {
        'parseResult': result => {
            return {
                a: result.number,
                a6: 'A' + result.number.toString().padStart(6, '0'),
                name: result.name.slice(0, result.name.indexOf('.') + 1),
                sample: result.data.split(',').slice(0, 8),
                more: result.data.length > 8,
                url: this.webRoot + 'A' + result.number.toString().padStart(6, '0')
            };
        },
        
        'outputError': (event, e) => {
            switch(e) {
                case 'no-results': event.reply(dbot.t('sequence_not_found')); return;
            }
            
            console.log(e);
            event.reply(dbot.t('oeis_error'));
        }
    };
    
    this.api = {
        'lookupSequenceByKeywords': async keywords => {
            var body = await rp({
                url: this.apiRoot,
                qs: {
                    fmt: 'json',
                    q: '"' + keywords + '"'
                },
                json: true
            });
            
            if(!body.results) throw 'no-results';
            return this.internalAPI.parseResult(body.results[0]);
        },
        
        'lookupSequenceByExample': async (terms, inOrder) => {
            var joinChar = inOrder ? ',' : ' ';
            var body = await rp({
                url: this.apiRoot,
                qs: {
                    fmt: 'json',
                    q: terms.join(joinChar)
                },
                json: true
            });
            
            if(!body.results) throw 'no-results';
            return this.internalAPI.parseResult(body.results[0]);
        },
        
        'lookupSequenceByA': async a => {
            var body = await rp({
                url: this.apiRoot,
                qs: {
                    fmt: 'json',
                    q: 'A' + a.toString().padStart(6, '0')
                },
                json: true
            });
            
            if(!body.results) throw 'no-results';
            return this.internalAPI.parseResult(body.results[0]);
        },
        
        'getRandomSequenceA': async set => {
            // This feature uses OEIS's 'webcam' which serves up random entries
            // each time the page is refreshed. It appears to be the only way to get
            // valid random entries from the database. The alternative is to just generate
            // random A-numbers from the set of all A-numbers, but that seems dirty to me.
            var body = await rp({
                url: this.webRoot + '/webcam',
                qs: {
                    fromjavascript: 1,
                    q: 'keyword:' + set
                }
            });
            
            // Find where the A-number is located
            var i = body.indexOf('<a href="/A');
            if (i < 0) throw 'no-results';
            i += 11;
            
            var a = body.slice(i, i + 6);
            return a;
        }
    };
    
    this.commands = {
        '~sequence': async event => {
            var result;
            
            try {
                if (event.input[1]) {
                    // digit sequence
                    let terms = event.params.slice(1);
                    result = await this.api.lookupSequenceByExample(terms, true);
                } else if (event.input[2]) {
                    // A-number
                    let a = event.input[2];
                    result = await this.api.lookupSequenceByA(a);
                } else {
                    // Keyword search or random request
                    if(event.input[3] == 'sequence') {
                        // Random request
                        let a = await this.api.getRandomSequenceA('nice');
                        console.log(a);
                        result = await this.api.lookupSequenceByA(a);
                    } else {
                        // Keyword search
                        let keywords = event.params.slice(1).join(' ');
                        result = await this.api.lookupSequenceByKeywords(keywords);
                    }
                }
            }
            catch(e) {
                this.internalAPI.outputError(event, e);
                return;
            }
            
            result.sample = result.sample.join(', ');
            if (result.more) result.sample += ', ...';
            
            event.reply(dbot.t('output_sequence', result));
        }
    }
    
    this.commands['~sequence'].regex = [/^sequence ((?:-?\d\s?)+)|A(\d+)|([\D\s]*)$/i, 4];
}

exports.fetch = dbot => new OEIS(dbot);