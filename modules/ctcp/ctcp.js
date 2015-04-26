var ctcp = function(dbot) {
    this.listener = function(event) {
        var matches = event.message.match(/\u0001[\w]+\u0001/);
        if(matches) {
            // We need the CTCP command
            var question = matches[0];
            // Cut \u0001 characters from command
            question = question.slice(1,question.length-1);
            switch(question) {
                case 'CLIENTINFO':
                    event.replyNotice("\u0001CLIENTINFO SOURCE VERSION USERINFO\u0001");
                    break;
                case 'FINGER':
                    event.replyNotice("\u0001FINGER STOP FINGERING ME BRO\u0001");
                    break;
                case 'SOURCE':
                    event.replyNotice("\u0001SOURCE "+dbot.config.repoRoot+"\u0001");
                    break;
                case 'TIME':
                    var d = new Date();
                    event.replyNotice("\u0001TIME "+d.toISOString()+"\u0001");
                    break;
                case 'USERINFO':
                    event.replyNotice("\u0001USERINFO "+dbot.config.name+"\u0001");
                    break;
                case 'VERSION':
                    event.replyNotice("\u0001VERSION "+dbot.config.version+"\u0001");
                    break;
                default:
                    event.replyNotice("\u0001"+question+" Idk what you want. Try CLIENTINFO.\u0001");
            }
        }
    };
    this.on = 'PRIVMSG';
};

exports.fetch = function(dbot) {
    return new ctcp(dbot);
};
