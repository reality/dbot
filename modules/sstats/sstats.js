/**
 * Module Name: sstats
 * Description: Simple Stats, in the absence of good ones.
 */
var _ = require('underscore')._,
    async = require('async');

var sstats = function(dbot) {
    if(!_.has(dbot.db, 'ssinception')) dbot.db.ssinception = new Date().getTime();

    // This needs to be somewhere else
    this.isUpperCase = function(word) {
        return _.all(word.split(''), function(c) {
            return c == c.toUpperCase(); 
        });
    };

    this.internalAPI = {
        // I'm not a huge fan of this but it's better than all the code
        // repetition
        'highscore': function(key, property, callback) {
            var pList = {}, 
                pPointer = property.split('.');

            this.db.scan(key, function(item) {
                var id = item.id;
                for(var i=0;i<pPointer.length;i++) {
                    if(_.has(item, pPointer[i])) {
                        item = item[pPointer[i]]; 
                    } else {
                        item = null; break;
                    }
                }

                if(item) {
                    pList[id] = item;
                }
            }, function() {
                var pCounts = _.chain(pList)
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
                    callback(pCounts);
                }.bind(this));
            });
        }.bind(this),

        'channelHighscore': function(key, server, channel, property, callback) {
            dbot.api.users.resolveChannel(server, channel, function(channel) {
                if(channel) {
                    var newProperty = 'channels.' + channel.id + '.' + property;
                    this.internalAPI.highscore(key, newProperty, callback);
                } else {
                    callback(null);
                }
            }.bind(this));
        }.bind(this),

        'formatHighscore': function(string, pCounts) {
            var output = string;
            for(var i=0;i<pCounts.length;i++) {
                output += pCounts[i][0] + " (" + pCounts[i][1] + "), ";
            }
            return output.slice(0, -2);
        }
    };

    this.listener = function(event) {
        event.cStats.lines++;
        event.uStats.lines++;

        var message = event.message.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g, "");
        var words = message.split(' '),
            wCount = words.length,
            capitals = 0,
            curses = 0;
        _.each(words, function(word) {
            if(this.isUpperCase(word)) capitals++;
            if(_.any(this.config.curses, function(curse) { return word.toLowerCase().indexOf(curse) != -1; })) {
                curses++;
            }
        }, this);

        event.uStats.words += wCount;
        event.uStats.capitals += capitals;
        event.uStats.curses += curses;
        event.uStats.last = new Date().getTime();

        event.cStats.words += wCount;
        event.cStats.capitals += capitals;
        event.cStats.curses += curses;

        if(!_.has(event.uStats.channels, event.rChannel.id)) {
            event.uStats.channels[event.rChannel.id] = { 
                'lines': 1,
                'words': wCount,
                'capitals': capitals,
                'curses': curses
            };
        } else {
            event.uStats.channels[event.rChannel.id].lines++;
            event.uStats.channels[event.rChannel.id].words += wCount;
            event.uStats.channels[event.rChannel.id].capitals += capitals;
            event.uStats.channels[event.rChannel.id].curses += curses;
        }

        // Look for tracked words.
        if(event.message.charAt(0) != '~') {
            var wMap = {}; // Why reduce isn't working idk
            _.each(words, function(word) {
                word = word.toLowerCase();
                if(!_.has(wMap, word)) wMap[word] = 0;
                wMap[word]++;
            });
            _.each(wMap, function(count, word) {
                this.api.getTrackedWord(word, function(tWord) {
                    if(tWord) {
                        tWord.total += count;
                        if(!_.has(tWord.channels, event.rChannel.id)) tWord.channels[event.rChannel.id] = 0;
                        if(!_.has(tWord.users, event.rUser.id)) tWord.users[event.rUser.id] = 0;
                        tWord.channels[event.rChannel.id] += count;
                        tWord.users[event.rUser.id] += count;
                        this.db.save('tracked_words', word, tWord, function() {}); 
                    }
                }.bind(this));
            }, this);
        }

        this.db.save('channel_stats', event.cStats.id, event.cStats, function() {});
        this.db.save('user_stats', event.uStats.id, event.uStats, function() {});
    }.bind(this);
    this.on = 'PRIVMSG';

    this.onLoad = function() {
        // Preload user stats
        dbot.instance.addPreEmitHook(function(event, callback) {
            if(!event.rUser) return callback();
            this.api.getUserStats(event.rUser.id, function(uStats) {
                if(uStats) {
                    event.uStats = uStats;
                    callback();
                } else {
                    this.api.createUserStats(event.rUser.id, function(uStats) {
                        event.uStats = uStats;
                        callback();
                    });
                }
            }.bind(this));
        }.bind(this));

        // Preload channel stats
        dbot.instance.addPreEmitHook(function(event, callback) {
            if(!event.rChannel) return callback();
            this.api.getChannelStats(event.rChannel.id, function(cStats) {
                if(cStats) {
                    event.cStats = cStats;
                    callback();
                } else {
                    this.api.createChannelStats(event.rChannel.id, function(cStats) {
                        event.cStats = cStats;
                        callback();
                    });
                }
            }.bind(this));
        }.bind(this));

        dbot.api.event.addHook('~mergeusers', function(server, oldUser, newUser) {
            this.api.getUserStats(oldUser.id, function(ouStats) {
                this.api.getUserStats(newUser.id, function(nuStats) {
                    _.each(ouStats, function(stat, key) {
                        if(_.isObject(stat) && key != 'creation') {
                            _.each(ouStats[key], function(stat, sKey) {
                                nuStats[key][sKey] += stat; 
                            });
                        } else {
                            nuStats[key] += stat; 
                        }
                    });
                    this.db.del('user_stats', oldUser.id, function() {});
                    this.db.save('user_stats', newUser.id, newUser, function() {});
                }.bind(this));
            }.bind(this));

            this.db.scan('tracked_words', function(tWord) {
                if(_.has(tWord.users, oldUser.id)) {
                    if(_.has(tWord.users, newUser.id)) {
                        tWord.users[newUser.id] += tWord.users[oldUser.id];
                    } else {
                        tWord.users[newUser.id] = tWord.users[oldUser.id];
                    }
                    delete tWord.users[oldUser.id];
                    this.db.save('tracked_words', tWord.word, tWord, function() {});
                }
            }.bind(this));
        }.bind(this));
    }.bind(this);
};

exports.fetch = function(dbot) {
    return new sstats(dbot);
};
