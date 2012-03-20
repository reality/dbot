var spelling = function(dbot) {
    var dbot = dbot;
    var last = {};

    var correct = function (data, correction, candidate, output_callback) {
        var rawCandidates = last[data.channel][candidate].split(' ').allGroupings();
        var candidates = [];
        for(var i=0;i<rawCandidates.length;i++) {
            candidates.push(rawCandidates[i].join(' '));
        }
        var winner = false;
        var winnerDistance = Infinity;

        for(var i=0;i<candidates.length;i++) {
            var distance = String.prototype.distance(correction.toLowerCase(), candidates[i].toLowerCase());
            if((distance < winnerDistance) && (distance > 0)) {
                winner = candidates[i];
                winnerDistance = distance;
            }
        }

        if(winnerDistance < Math.ceil(winner.length * 1.33)) {
            if(winner !== correction) {
                var fix = last[data.channel][candidate].replace(winner, correction);
                if (/^.ACTION/.test(fix)) {
                    fix = fix.replace(/^.ACTION/, '/me');
                }
                last[data.channel][candidate] = fix;
                var output = {
                    'fix': fix,
                    'correcter': data.user,
                    'candidate': candidate
                };
                output_callback(output);
            }
        }
    }
    
    return {
        'listener': function(data, params) {
            var q = data.message.valMatch(/^(?:\*\*?([\d\w\s']*)|([\d\w\s']*)\*\*?)$/, 3);
            var otherQ = data.message.valMatch(/^([\d\w\s]*): (?:\*\*?([\d\w\s']*)|([\d\w\s']*)\*\*?)$/, 4);
            if(q) {
                correct(data, q[1] || q[2], data.user, function (e) {
                    dbot.say(data.channel, dbot.strings[dbot.language].spelling_self.format(e));
                });
            } else if(otherQ) {
                correct(data, otherQ[2] || otherQ[3], otherQ[1], function (e) {
                    dbot.say(data.channel, dbot.strings[dbot.language].spelling_other.format(e));
                });
            } else {
                 if(last.hasOwnProperty(data.channel)) {
                   last[data.channel][data.user] = data.message; 
                } else {
                    last[data.channel] = { };
                    last[data.channel][data.user] = data.message;
                }
            }
        },

        'on': 'PRIVMSG'
    }
} 

exports.fetch = function(dbot) {
    return spelling(dbot);
};
