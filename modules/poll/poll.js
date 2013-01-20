var poll = function(dbot) {
    this.internalAPI = {
        'updatePollNicks': function(server, oldNick) {
            var newNick = dbot.api.users.resolveUser(server, oldNick);
            _.each(dbot.db.polls, function(poll) {
                if(poll.owner === oldNick) {
                    poll.owner = newNick;
                }
                if(_.has(poll.votees, oldNick)) {
                    poll.votees[newNick] = poll.votees[oldNick];
                    delete poll.votees[oldNick];
                }
            }, this);
        }
    };

    this.onLoad = function() {
        dbot.api.command.addHook('~setaliasparent', this.internalAPI.updatePollNicks);
        dbot.api.command.addHook('~mergeusers', this.internalAPI.updatePollNicks);
    }.bind(this);
};

exports.fetch = function(dbot) {
    return new poll(dbot);
}
