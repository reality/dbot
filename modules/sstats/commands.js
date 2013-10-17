var _ = require('underscore')._,
    async = require('async');

var commands = function(dbot) {
    var commands = {
        '~words': function(event) {
            var getWords = function(user) {
                this.api.getUserStats(user.id, function(uStats) {
                    if(uStats) {
                        var output = dbot.t('sstats_uwords', {
                            'user': user.primaryNick,
                            'words': uStats.words,
                            'curses': uStats.curses,
                            'capitals': uStats.capitals
                        });
                        if(event.rChannel && _.has(uStats.channels, event.rChannel.id)) {
                            ucStats = uStats.channels[event.rChannel.id];
                            output += dbot.t('sstats_ucwords', {
                                'channel': event.channel,
                                'words': ucStats.words,
                                'curses': ucStats.curses,
                                'capitals': ucStats.capitals
                            });
                        }
                        event.reply(output);
                    } else {
                        event.reply(dbot.t('sstats_noustats'));
                    }
                });
            }.bind(this);

            if(event.params[1]) {
                dbot.api.users.resolveUser(event.server, event.params[1], function(user) {
                    if(user) {
                        getWords(user);
                    } else {
                        event.reply(dbot.t('sstats_unknown_user'));
                    }
                });
            } else {
                getWords(event.rUser);
            }
        },

        '~lines': function(event) {
            var getLines = function(user) {
                this.api.getUserStats(user.id, function(uStats) {
                    if(uStats) {
                        var output = dbot.t('sstats_tlines', { 
                            'user': user.primaryNick,
                            'lines': uStats.lines 
                        });
                        if(event.rChannel && _.has(uStats.channels, event.rChannel.id)) {
                            output += dbot.t('sstats_uclines', { 
                                'channel': event.channel,
                                'lines': uStats.channels[event.rChannel.id].lines 
                            });
                        }
                        event.reply(output);
                    } else {
                        event.reply(dbot.t('sstats_noustats'));
                    }
                });       
            }.bind(this);

            if(event.params[1]) {
                dbot.api.users.resolveUser(event.server, event.params[1], function(user) {
                    if(user) {
                        getLines(user);
                    } else {
                        event.reply(dbot.t('sstats_unknown_user'));
                    }
                });
            } else {
                getLines(event.rUser);
            }
        },

        '~loudest': function(event) {
            this.internalAPI.highscore('user_stats', 'lines', function(lCounts) {
                async.eachSeries(lCounts, function(lCount, next) {
                    dbot.api.users.getUser(lCount[0], function(user) {
                        lCount[0] = user.primaryNick; next();
                    });
                }, function() {
                    event.reply(this.internalAPI.formatHighscore('Loudest users: ', lCounts));
                }.bind(this));
            }.bind(this));
        },

        '~uncouth': function(event) {
            this.internalAPI.highscore('user_stats', 'curses', function(lCounts) {
                async.eachSeries(lCounts, function(lCount, next) {
                    dbot.api.users.getUser(lCount[0], function(user) {
                        lCount[0] = user.primaryNick; next();
                    });
                }, function() {
                    event.reply(this.internalAPI.formatHighscore('Most uncouth users: ', lCounts));
                }.bind(this));
            }.bind(this));
        },

        '~shoutiest': function(event) {
            this.internalAPI.highscore('user_stats', 'capitals', function(lCounts) {
                async.eachSeries(lCounts, function(lCount, next) {
                    dbot.api.users.getUser(lCount[0], function(user) {
                        lCount[0] = user.primaryNick; next();
                    });
                }, function() {
                    event.reply(this.internalAPI.formatHighscore('Shoutiest users: ', lCounts));
                }.bind(this));
            }.bind(this));
        },

        '~wordiest': function(event) {
            this.internalAPI.highscore('user_stats', 'words', function(lCounts) {
                async.eachSeries(lCounts, function(lCount, next) {
                    dbot.api.users.getUser(lCount[0], function(user) {
                        lCount[0] = user.primaryNick; next();
                    });
                }, function() {
                    event.reply(this.internalAPI.formatHighscore('Wordiest users: ', lCounts));
                }.bind(this));
            }.bind(this));
        },

        '~cloudest': function(event) {
            var pathString = 'channels.' + event.rChannel.id + '.lines';
            this.internalAPI.highscore('user_stats', pathString, function(lCounts) {
                async.eachSeries(lCounts, function(lCount, next) {
                    dbot.api.users.getUser(lCount[0], function(user) {
                        lCount[0] = user.primaryNick; next();
                    });
                }, function() {
                    event.reply(this.internalAPI.formatHighscore('Loudest users in ' + event.channel + ': ', lCounts));
                }.bind(this));;
            }.bind(this));
        },

        '~clines': function(event) {
            if(!event.cStats) return;
            event.reply(dbot.t('sstats_clines', { 
                'channel': event.channel, 
                'lines': event.cStats.lines 
            }));
        }
    };
    return commands;
};

exports.fetch = function(dbot) {
    return commands(dbot);
};
