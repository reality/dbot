/**
    * Name: Minify
    * Description: Provides url minifier functionality via one of a number of URL Minifier services
*/

var request = require('request'),
    _ = require('underscore')._;

var minify = function(dbot) {
    
    // This is where you provide support for new minifiers
    // callback(miniURL, error);
    // this.config contains only the configuration options for the given minifier
    // example: if your minifier is "bitly" then this.config.myvalue = config.json entry "minifiers-bitly-myvalue"
    this.minifiers = {
        'bitly': function(url, callback) {
            request({
                'url': this.config.url,
                'qs': {
                    'access_token': this.config.access_token,
                    'longUrl': encodeURI(url)
                },
                'json': true
            }, function(error, response, body) {
                if(!error && response.statusCode == 200) {
                    if (body.status_code == 200) {
                        callback(body.data.url);
                    } else {
                        callback(false, body.status_txt);
                    }
                } else {
                    callback(false, error);
                }
            });
        }
    };
    
    
    // API
    //   minify(url, minifier, callback(miniUrl, error))
    //     calls 'callback' with a minified url string, or false. if 'false' the error parameter may be populated.
    //     if minifier is undefined then the default minifier is used
    
    this.api = {
        'minify': function(url, minifier, callback) {
            if (typeof minifier === "function") {
                callback = minifier;
                minifier = this.config.defaultMinifier;
            }
            
            if (!minifier) minifier = this.config.defaultMinifier;
            
            var mf = this.minifiers[minifier.trim()];
            if (!mf) {
                // specified minifier does not exist
                callback(false, "minifier_not_found");
                return;
            }
            
            mf(url, callback)
        }
    };
    
    
    // Commands
    //   ~minify URL
    //     returns a minified URL using the default minifier
    //     ex: "~minify http://google.com"
    //   ~minify minifier URL
    //     returns a minified URL using the specified minifier
    //     ex: "~minify goo.gl http://google.com"
    //     ex: "~minify bit.ly http://google.com"
    
    
    this.commands = {
        '~minify': function(event) {
            this.api.minify(event.input[2].trim(), event.input[1], function(mUrl, error) {
                if (mUrl) {
                    event.reply(dbot.t('success', { 'miniurl': mUrl }));
                } else {
                    if(error == "minifier_not_found") {
                        event.reply(dbot.t('fail-bad-minimizer'));
                    } else {
                        event.reply(dbot.t('fail', { 'reason': error }));
                    }
                }
            });
        }
    };
    
    this.commands['~minify'].regex = [/^minify ([\d\w-]+[\d\w\s-]*[ ])?(.+)$/, 3];
    
    this.onLoad = function() {
        this.minifiers = _.mapObject(this.minifiers, function(m, mName) {
            var minifierConfig = _.pick(this.config, function(v,k) { return k.startsWith("minifier-" + mName + "-"); });
            minifierConfig = _.reduce(minifierConfig, function(r,v,k) {
                var tlk = "minifier-" + mName + "-";
                var tlkl = tlk.length;
                var nk = k.slice(tlkl);
                r[nk] = v;
                return r;
            }, { });
            
            var minifier = {
                name: mName,
                config: minifierConfig
            }
            
            return m.bind(minifier);
        }.bind(this));
    }.bind(this);
}

exports.fetch = function(dbot) {
    return new minify(dbot);
};