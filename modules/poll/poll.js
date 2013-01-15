var poll = function(dbot) {
    this.name = poll;
    this.ignorable = true;
};

exports.fetch = function(dbot) {
    return new poll(dbot);
}
