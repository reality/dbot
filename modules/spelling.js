var spelling = function(dbot) {
    var dbot = dbot;
    var last = {};
    
    return {
        'listener': function(data, params) {
            var q = data.message.valMatch(/^\*([\d\w\s]*)/, 2);
            if(q) {
                var correction = q[1];
                var candidates = last[data.channel][data.user].split(' ');
                var winner = false;

                for(int i=0;i<candidates.length;i++) {
                    var distance = String.prototype.distance(correction, candidates[i]);
                    if(distance > winner) {
                        winner = candidates[i];
                    }
                }
                
                if(winner < 3) {
                    var fix = data.message.replace(winner, correction); 
                    dbot.say(data.channel, data.user + ':' + fix);
                }
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

exports.fetch = function(dbot) {
    return spelling(dbot);
};
