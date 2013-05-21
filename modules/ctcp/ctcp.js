var ctcp = function(dbot) {
    var commands = {
        "\x01VERSION\x01": function(event) {
            // the current client version
            event.replyNotice("\x01VERSION " + dbot.config.version + "\x01");
        },
        "\x01CLIENTINFO\x01": function(event){
            // a list of all supported CTCP commands
            event.replyNotice("\x01CLIENTINFO SOURCE VERSION USERINFO\x01");
        },
        "\x01SOURCE\x01": function(event){
            event.replyNotice("\x01SOURCE https://github.com/reality/depressionbot\x01");
        },
        "\x01USERINFO\x01": function(event){
            // a "witty" saying set by the user
            event.replyNotice("\z01USERINFO " + dbot.config.name + "\x01");
        }
    }
    this.commands = commands;
    this.on = 'PRIVMSG';
};

exports.fetch = function(dbot) {
    return new ctcp(dbot);
};
