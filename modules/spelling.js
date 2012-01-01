var spelling = function(dbot) {
    var dbot = dbot;
    var last = {};

    var correct = function (data, correction, candidate, output_callback) {
        var candidates = last[data.channel][candidate].split(' ');
        var winner = false;
        var winnerDistance = Infinity; //urgh fix later

        for(var i=0;i<candidates.length;i++) {
            var distance = String.prototype.distance(correction, candidates[i]);
            if(distance < winnerDistance) {
                winner = candidates[i];
                winnerDistance = distance;
            }
        }

        if(winnerDistance < 3) {
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
            var q = data.message.valMatch(/^\*\*?([\d\w\s]*)/, 2);
            var otherQ = data.message.valMatch(/^([\d\w\s]*): \*\*?([\d\w\s]*)/, 3);
            if(q) {
                correct(data, q[1], data.user, function (e) {
                    dbot.say(data.channel, e.correcter + ' meant: ' + e.fix);
                });
            } else if(otherQ) {
                correct(data, otherQ[2], otherQ[1], function (e) {
                    dbot.say(data.channel, e.correcter + ' thinks ' + e.candidate + ' meant: ' + e.fix);
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
