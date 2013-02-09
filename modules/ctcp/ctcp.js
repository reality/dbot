var ctcp = function(dbot) {
    var commands = {
        "\x01VERSION\x01": function(event) {
            event.replyNotice("\x01VERSION " + dbot.config.version + "\x01");
        }
    }
    this.commands = commands;
    this.on = 'PRIVMSG';
};

exports.fetch = function(dbot) {
    return new ctcp(dbot);
};
