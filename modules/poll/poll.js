var poll = function(dbot) {
    this.internalAPI = {
        'updatePollNicks': function(server, oldUser, newUser) {
            this.db.scan('poll', function(poll) {
                var needsUpdating = false;
                if(poll.owner == oldUser.id) {
                    poll.owner = newUser.id;
                    needsUpdating = true;
                }
                if(_.has(poll.votees, oldUser.id)) {
                    poll.votes[poll.votees[oldUser.id]]--;
                    delete poll.votees[oldUser.id];
                    needsUpdating = true;
                }
                if(needsUpdating) {
                    this.db.save('poll', poll.name, poll, function(err) {});
                }
            }.bind(this), function(err) {});
        }.bind(this)
    };

    this.onLoad = function() {
       dbot.api.event.addHook('~mergeusers', this.internalAPI.updatePollNicks);
    }.bind(this);
};

exports.fetch = function(dbot) {
    return new poll(dbot);
}
