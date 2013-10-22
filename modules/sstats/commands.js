var _ = require('underscore')._,
    async = require('async'),
    moment = require('moment');

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
                            'capitals': uStats.capitals,
                            'date': new Date(uStats.creation).format('dd/mm/YYYY')
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
                            'lines': uStats.lines,
                            'date': new Date(uStats.creation).format('dd/mm/YYYY')
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
            var channel = event.params[1];

            if(_.isUndefined(channel)) {
                this.internalAPI.highscore('user_stats', 'lines', function(lCounts) {
                    event.reply(this.internalAPI.formatHighscore('Loudest users: ', lCounts));
                }.bind(this));
            } else {
                this.internalAPI.channelHighscore('user_stats', event.server, channel, 'lines', function(lCounts) {
                    if(lCounts) {
                        event.reply(this.internalAPI.formatHighscore('Loudest users in ' + channel + ': ', lCounts));
                    } else {
                        event.reply('Unknown channel.');
                    }
                }.bind(this));
            }
        },

        '~uncouth': function(event) {
            var channel = event.params[1];

            if(_.isUndefined(channel)) {
                this.internalAPI.highscore('user_stats', 'curses', function(lCounts) {
                    event.reply(this.internalAPI.formatHighscore('Most uncouth users: ', lCounts));
                }.bind(this));
            } else {
                this.internalAPI.channelHighscore('user_stats', event.server, channel, 'curses', function(lCounts) {
                    if(lCounts) {
                        event.reply(this.internalAPI.formatHighscore('Most uncouth users in ' + channel + ': ', lCounts));
                    } else {
                        event.reply('Unknown channel.');
                    }
                }.bind(this));
            }
        },

        '~shoutiest': function(event) {
            var channel = event.params[1];

            if(_.isUndefined(channel)) {
                this.internalAPI.highscore('user_stats', 'capitals', function(lCounts) {
                    event.reply(this.internalAPI.formatHighscore('Shoutiest users: ', lCounts));
                }.bind(this));
            } else {
                this.internalAPI.channelHighscore('user_stats', event.server, channel, 'capitals', function(lCounts) {
                    if(lCounts) {
                        event.reply(this.internalAPI.formatHighscore('Shoutiest users in ' + channel + ': ', lCounts));
                    } else {
                        event.reply('Unknown channel.');
                    }
                }.bind(this));
            }
        },

        '~wordiest': function(event) {
            var channel = event.params[1];

            if(_.isUndefined(channel)) {
                this.internalAPI.highscore('user_stats', 'words', function(lCounts) {
                    event.reply(this.internalAPI.formatHighscore('Wordiest users: ', lCounts));
                }.bind(this));
            } else {
                this.internalAPI.channelHighscore('user_stats', event.server, channel, 'words', function(lCounts) {
                    if(lCounts) {
                        event.reply(this.internalAPI.formatHighscore('Wordiest users in ' + channel + ': ', lCounts));
                    } else {
                        event.reply('Unknown channel.');
                    }
                }.bind(this));
            }
        },

        '~clines': function(event) {
            if(!event.cStats) return;
            event.reply(dbot.t('sstats_clines', { 
                'channel': event.channel, 
                'lines': event.cStats.lines 
            }));
        },

        '~last': function(event) {
            dbot.api.users.resolveUser(event.server, event.params[1], function(user) {
                if(user) {
                    this.api.getUserStats(user.id, function(uStats) {
                        if(uStats && uStats.last) {
                            event.reply(user.primaryNick + ' was last seen ' + moment(uStats.last).fromNow() + '.'); 
                        } else {
                            event.reply('I haven\'t seen that user active yet.');
                        }
                    });
                } else {
                    event.reply('Unknown user.');
                } 
            }.bind(this));
        },

        '~trackword': function(event) {
            var word = event.params[1].trim().toLowerCase();
            this.api.getTrackedWord(word, function(tWord) {
                if(!tWord) {
                    this.api.createTrackedWord(word, function(tWord) {
                        event.reply('Now tracking ' + word); 
                    });
                } else {
                    event.reply('Word already being tracked.');
                }
            }.bind(this));
        },

        '~word': function(event) {
            var word = event.params[1].trim().toLowerCase();
            this.api.getTrackedWord(word, function(tWord) {
                if(tWord) {
                    event.reply(dbot.t('sstats_word', {
                        'word': word,
                        'total': tWord.total,
                        'channels': _.keys(tWord.channels).length, 
                        'users': _.keys(tWord.users).length,
                        'since': new Date(tWord.creation)
                    }));
                } else {
                    event.reply(word + ' isn\'t being tracked.');
                }
            });
        },

        // merge to some raw highscore thing 
        '~wordusers': function(event) {
            var word = event.params[1].trim().toLowerCase();
            this.api.getTrackedWord(word, function(tWord) {
                if(tWord) {
                    var pCounts = _.chain(tWord.users)
                        .pairs()
                        .sortBy(function(p) { return p[1]; })
                        .reverse()
                        .first(10)
                        .value();

                    async.eachSeries(pCounts, function(pCount, next) {
                        dbot.api.users.getUser(pCount[0], function(user) {
                            pCount[0] = user.primaryNick; next();
                        });
                    }, function() {
                        event.reply(this.internalAPI.formatHighscore('Top ' + word + ' users: ', pCounts));
                    }.bind(this));
                } else {
                    event.reply(word + ' isn\'t being tracked.');
                }
            }.bind(this));
        }
    };

    commands['~wordusers'].regex = [/^~wordusers ([\d\w[\]{}^|\\<>`_-]+?)/, 2];
    commands['~word'].regex = [/^~word ([\d\w[\]{}^|\\<>`_-]+?)/, 2];
    commands['~trackword'].regex = [/^~trackword ([\d\w[\]{}^|\\<>`_-]+?)/, 2];
    commands['~trackword'].access = 'power_user';
    return commands;
};

exports.fetch = function(dbot) {
    return commands(dbot);
};
