var spelling = function(dbot) {
    var last = {};

    var correct = function (event, correction, candidate, output_callback) {
        var rawCandidates = last[event.channel.name][candidate].split(' ').allGroupings();
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
                var fix = last[event.channel.name][candidate].replace(winner, correction);
                if (/^.ACTION/.test(fix)) {
                    fix = fix.replace(/^.ACTION/, '/me');
                }
                last[event.channel.name][candidate] = fix;
                var output = {
                    'fix': fix,
                    'correcter': event.user,
                    'candidate': candidate
                };
                output_callback(output);
            }
        }
    }
    
    return {
        'name': 'spelling',
        'ignorable': true,

        'listener': function(event) {
            var q = event.message.valMatch(/^(?:\*\*?([\d\w\s']*)|([\d\w\s']*)\*\*?)$/, 3);
            var otherQ = event.message.valMatch(/^([\d\w\s]*): (?:\*\*?([\d\w\s']*)|([\d\w\s']*)\*\*?)$/, 4);
            if(q) {
                correct(event, q[1] || q[2], event.user, function (e) {
                    event.reply(dbot.t('spelling_self', e));
                });
            } else if(otherQ) {
                correct(event, otherQ[2] || otherQ[3], otherQ[1], function (e) {
                    event.reply(dbot.t('spelling_other', e));
                });
            } else {
                 if(last.hasOwnProperty(event.channel.name)) {
                   last[event.channel.name][event.user] = event.message; 
                } else {
                    last[event.channel.name] = { };
                    last[event.channel.name][event.user] = event.message;
                }
            }
        },
        'on': 'PRIVMSG'
    }
} 

exports.fetch = function(dbot) {
    return spelling(dbot);
};
