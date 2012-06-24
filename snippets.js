/*** Array ***/

Array.prototype.random = function() {
    return this[Math.floor((Math.random()*this.length))];
};

Array.prototype.each = function(fun) {
    for(var i=0;i<this.length;i++) {
        fun(this[i]);
    }
};

Array.prototype.collect = function(fun) {
    var collect = [];
    for(var i=0;i<this.length;i++) {
        collect.push(fun(this[i]));
    }
    return collect;
};

Array.prototype.include = function(value) {
    for(var i=0;i<this.length;i++) {
        if(this[i] == value) {
            return true;
        }
    }
    return false;
};

Array.prototype.sum = function() {
    var sum = 0;
    for(var i=0;i<this.length;i++) {
        sum += (parseFloat(this[i]) || 0);
    }
    return sum;
};

Array.prototype.allGroupings = function() {
    if (this.length == 0) {
        return [];  /* short-circuit the empty-array case */
    }
    var groupings = [];
    for(var n=1;n<=this.length;n++) {
        for(var i=0;i<(this.length-(n-1));i++) {
            groupings.push(this.slice(i, i+n));
        }
    }
    return groupings;
}

Array.prototype.uniq = function() {
    var hash = {}
    var result = [];
    this.each(function(item) {
        if(!hash.hasOwnProperty(item)){
            hash[item] = true;
            result.push(item);
        }
    });
    return result;
}

/*** String ***/

String.prototype.valMatch = function(regex, expLength) {
    var key = this.match(regex);
    if(key !== null && key.length == expLength) {
        return key;
    } else {
        return false;
    }
};

String.prototype.endsWith = function(needle) {
    return needle === this.slice(this.length - needle.length);
};

String.prototype.startsWith = function(needle) {
    return needle === this.slice(0, needle.length);
};

String.prototype.distance = function(s1, s2) {
    // Calculate Levenshtein distance between two strings  
    // 
    // version: 1109.2015
    // discuss at: http://phpjs.org/functions/levenshtein    // +            original by: Carlos R. L. Rodrigues (http://www.jsfromhell.com)
    // +            bugfixed by: Onno Marsman
    // +             revised by: Andrea Giammarchi (http://webreflection.blogspot.com)
    // + reimplemented by: Brett Zamir (http://brett-zamir.me)
    // + reimplemented by: Alexander M Beedie    // *                example 1: levenshtein('Kevin van Zonneveld', 'Kevin van Sommeveld');
    // *                returns 1: 3
    if (s1 == s2) {
        return 0;
    } 
    var s1_len = s1.length;
    var s2_len = s2.length;
    if (s1_len === 0) {
        return s2_len;    }
    if (s2_len === 0) {
        return s1_len;
    }
     // BEGIN STATIC
    var split = false;
    try {
        split = !('0')[0];
    } catch (e) {        split = true; // Earlier IE may not support access by string index
    }
    // END STATIC
    if (split) {
        s1 = s1.split('');        s2 = s2.split('');
    }
 
    var v0 = new Array(s1_len + 1);
    var v1 = new Array(s1_len + 1); 
    var s1_idx = 0,
        s2_idx = 0,
        cost = 0;
    for (s1_idx = 0; s1_idx < s1_len + 1; s1_idx++) {        v0[s1_idx] = s1_idx;
    }
    var char_s1 = '',
        char_s2 = '';
    for (s2_idx = 1; s2_idx <= s2_len; s2_idx++) {        v1[0] = s2_idx;
        char_s2 = s2[s2_idx - 1];
 
        for (s1_idx = 0; s1_idx < s1_len; s1_idx++) {
            char_s1 = s1[s1_idx];            cost = (char_s1 == char_s2) ? 0 : 1;
            var m_min = v0[s1_idx + 1] + 1;
            var b = v1[s1_idx] + 1;
            var c = v0[s1_idx] + cost;
            if (b < m_min) {                m_min = b;
            }
            if (c < m_min) {
                m_min = c;
            }            v1[s1_idx + 1] = m_min;
        }
        var v_tmp = v0;
        v0 = v1;
        v1 = v_tmp;    }
    return v0[s1_len];
}

String.prototype.format = function() { // format takes either multiple indexed arguments, or a single object, whose keys/values will be used
    var targetStr = this;
    var replacements = [].splice.call(arguments, 0);
    if ((replacements.length === 1) && (typeof(replacements[0]) === 'object')) { // if we were passed a single object rather than multiple args
        replacements = replacements[0]; // use the object as source of replacements
    };
    for (key in replacements) {
        if (replacements.hasOwnProperty(key)) {
            var replacePattern = new RegExp("\\{"+key+"\\}", "g");
            targetStr = targetStr.replace(replacePattern, replacements[key]);
        };
    };
    return targetStr;
};

/*** Object ***/

Object.prototype.isFunction = function(obj) {
    return typeof(obj) === 'function';
};

Object.prototype.isArray = function(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
};

/*Object.prototype.withAll = function(fun) {
    for(key in this) {
        if(this.hasOwnProperty(key)){
            fun(key, this[key]);
        }
    }
};*/

Object.prototype.length = function() {
    var l = 0;
    for(key in this)
        if(this.hasOwnProperty(key))
            l++;
    return l;
};

Object.prototype.sort = function(object, scorer) {
    var sortArr = [];
    for(var key in object) {
        if(object.hasOwnProperty(key)) {
            sortArr.push([key, scorer(key, object)]);
        }
    }
    return sortArr.sort(function(a, b) { return a[1] - b[1]; });
};

/*** Integer ***/

Number.prototype.chanceIn = function(x, y) {
    var num = Math.floor(Math.random() * (y + 1)) / x;
    return num == 1;
};

/*** Regex ***/
RegExp.prototype.url_regex = function() {
    var reg = new RegExp(
       "^" +
       // protocol identifier
       "(?:(?:https?|ftp)://)" +
       // user:pass authentication
       "(?:\\S+(?::\\S*)?@)?" +
       "(?:" +
       // IP address exclusion
       // private & local networks
       "(?!10(?:\\.\\d{1,3}){3})" +
       "(?!127(?:\\.\\d{1,3}){3})" +
       "(?!169\\.254(?:\\.\\d{1,3}){2})" +
       "(?!192\\.168(?:\\.\\d{1,3}){2})" +
       "(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})" +
       // IP address dotted notation octets
       // excludes loopback network 0.0.0.0
       // excludes reserved space >= 224.0.0.0
       // excludes network & broacast addresses
       // (first & last IP address of each class)
       "(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])" +
       "(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}" +
       "(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))" +
       "|" +
       // host name
       "(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)" +
       // domain name
       "(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*" +
       // TLD identifier
       "(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))" +
       ")" +
       // port number
       "(?::\\d{2,5})?" +
       // resource path
        "(?:/[^\\s]*)?" +
        "$", "i"
    );
    return reg;
}
