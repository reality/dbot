var _ = require('underscore')._;

var allGroupings = function(arr) {
    if (arr.length == 0) {
        return [];  /* short-circuit the empty-array case */
    }
    var groupings = [];
    for(var n=1;n<=arr.length;n++) {
        for(var i=0;i<(arr.length-(n-1));i++) {
            groupings.push(arr.slice(i, i+n));
        }
    }
    return groupings;
}
var distance = function(s1, s2) {
    // Calculate Levenshtein distance between two strings  
    // 
    // version: 1109.2015
    // discuss at: http://phpjs.org/functions/levenshtein    
    // + original by: Carlos R. L. Rodrigues (http://www.jsfromhell.com)
    // + bugfixed by: Onno Marsman
    // + revised by: Andrea Giammarchi (http://webreflection.blogspot.com)
    // + reimplemented by: Brett Zamir (http://brett-zamir.me)
    // + reimplemented by: Alexander M Beedie    
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
    } catch (e) {        
        split = true; // Earlier IE may not support access by string index
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
};

var spelling = function(dbot) {
    this.last = {};
    this.internalAPI = {};
    this.internalAPI.correct = function (event, correction, candidate, output_callback) {
        var rawCandidates = allGroupings(this.last[event.channel.name][candidate].split(' '));

        var candidates = [];
        for(var i=0;i<rawCandidates.length;i++) {
            candidates.push(rawCandidates[i].join(' '));
        }
        var winner = false;
        var winnerDistance = Infinity;

        for(var i=0;i<candidates.length;i++) {
            var d = distance(correction.toLowerCase(), candidates[i].toLowerCase());
            if((d < winnerDistance) && (d > 0)) {
                winner = candidates[i];
                winnerDistance = d;
            }
        }

        if(winnerDistance < Math.ceil(winner.length * 1.33)) {
            if(winner !== correction) {
                var fix = this.last[event.channel.name][candidate].replace(winner, correction);
                if (/^.ACTION/.test(fix)) {
                    fix = fix.replace(/^.ACTION/, '/me');
                    fix = fix.replace("\x01", '');
                }
                this.last[event.channel.name][candidate] = fix;
                var output = {
                    'fix': fix,
                    'correcter': event.user,
                    'candidate': candidate
                };
                output_callback(output);
            }
        }
    }.bind(this); 

    this.listener = function(event) {
        var q = event.message.valMatch(/^(?:\*\*?([\d\w\s']*)|([\d\w\s']*)\*\*?)$/, 3);
        var otherQ = event.message.valMatch(/^([\d\w\s]*)[:|,] (?:\*\*?([\d\w\s']*)|([\d\w\s']*)\*\*?)$/, 4);
        if(q) {
            this.internalAPI.correct(event, q[1] || q[2], event.user, function (e) {
                event.reply(dbot.t('spelling_self', e));
            });
        } else if(otherQ) {
            this.internalAPI.correct(event, otherQ[2] || otherQ[3], otherQ[1], function (e) {
                event.reply(dbot.t('spelling_other', e));
            });
        } else {
             if(_.has(this.last, event.channel.name)) {
               this.last[event.channel.name][event.user] = event.message; 
            } else {
                this.last[event.channel.name] = { };
                this.last[event.channel.name][event.user] = event.message;
            }
        }
    }.bind(this);
    this.on = 'PRIVMSG';
} 

exports.fetch = function(dbot) {
    return new spelling(dbot);
};
