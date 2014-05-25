var _ = require('underscore')._,
    async = require('async'),
    moment = require('moment-timezone');

var pages = function(dbot) {
    var pages = {
        '/notify': function(req, res) {
            var server = req.user.server,
                userCount = {},
                users = [],
                channelCount = {},
                tags = {};

            this.db.scan('notifies', function(notify) {
                if(!_.has(userCount, notify.user)) {
                    userCount[notify.user] = 0;
                }
                if(!_.has(channelCount, notify.channel)) {
                    channelCount[notify.channel] = 0;
                }
                userCount[notify.user]++;
                channelCount[notify.channel]++;
                _.each(notify.tags, function(tag) {
                    if(!_.has(tags, tag)) tags[tag] = 0;
                    tags[tag]++;
                });
            }, function() {
                userCount = _.map(userCount, function(value, key) { 
                    return {
                        'id': key, 
                        'count': value 
                    } 
                });

                async.eachSeries(userCount, function(userCount, next) {
                    dbot.api.users.getUser(userCount.id, function(user) {
                        if(user) {
                            userCount['name'] = user.primaryNick;
                            users.push(userCount);
                        }
                        next();
                    });
                }, function() {
                    res.render('channels', {
                        'server': server,
                        'users': users.sort(),
                        'channels': channelCount,
                        'tags': tags
                    });
                });
            });
        },

        '/notify/stream': function(req, res) {
            var staffedChannels = [],
                notifications = [];

            async.each(req.user.channels, function(cId, done) {
                dbot.api.users.getChannel(cId, function(channel) {
                    if(_.include(channel.op, req.user.id) ||
                            (this.config.notifyVoice && _.include(channel.voice, req.user.id))) {
                        staffedChannels.push(channel.name);
                    }
                    done();
                }.bind(this));
            }.bind(this), function() {
                async.each(staffedChannels, function(cName, done) {
                    this.db.search('notifies', { 'server': req.user.server, 'channel': cName }, function(notify) {
                        notifications.push(notify); 
                    }, function() {
                        done();
                    });
                }.bind(this), function() {
                    async.each(notifications, function(notify, done) {
                        dbot.api.users.getUser(notify.user, function(user) {
                            if(user) notify.user = user.primaryNick;
                            done();
                        });
                    }, function() {
                        var timezone = req.user.timezone || 'Europe/London';
                        notifications = _.sortBy(notifications, 'time').reverse();
                        _.each(notifications, function(v, k) {
                            v.time = moment(v.time).tz(timezone);
                        });

                        res.render('notifies', {
                            'server': req.user.server,
                            'notifies': notifications
                        });
                    });
                }.bind(this));
            }.bind(this));
        },

        '/notify/missing': function(req, res) {
            var server = req.user.server,
                user = req.user,
                notifies = this.pending[user.id];

            var timezone = req.user.timezone || 'Europe/London';
            notifies = _.sortBy(notifies, 'time').reverse();
            _.each(notifies, function(v, k) {
                v.time = moment(v.time).tz(timezone);
            });

            res.render('missing_notifies', {
                'user': user.primaryNick,
                'notifies': notifies
            });

            if(_.has(dbot.modules, 'log')) {
                dbot.api.log.log(server, user.primaryNick, 
                    'Checked their missing notifications.');
            }
        },

        '/notify/:item': function(req, res) {
            var server = req.user.server,
                type = req.query.t,
                notifies = [];

            console.log(type);

            if(req.params.item.charAt(0) == '#') {
                var item = req.params.item,
                search = {
                    'server': server,
                };
                if(type != 'tag') search.channel = item;

                this.db.search('notifies', search, function(notify) {
                    if(type == 'tag') {
                        if(_.include(notify.tags, item)) notifies.push(notify);
                    } else {
                        notifies.push(notify);
                    }
                }, function(err) {
                    var pNickCache = {};
                    async.eachSeries(notifies, function(notify, next) {
                        if(!_.has(pNickCache, notify.user)) {
                            dbot.api.users.getUser(notify.user, function(user) {
                                pNickCache[notify.user] = user.primaryNick;
                                notify.user = user.primaryNick; 
                                next();
                            });
                        } else {
                            notify.user = pNickCache[notify.user];
                            next();
                        }
                    }, function() {
                        var timezone = req.user.timezone || 'Europe/London';
                        notifies = _.sortBy(notifies, 'time').reverse();
                        _.each(notifies, function(v, k) {
                            v.time = moment(v.time).tz(timezone);
                        });

                        res.render('notifies', {
                            'server': server,
                            'notifies': notifies
                        });
                    });
                });
            } else {
                var username = req.params.item;

                dbot.api.users.resolveUser(server, username, function(user) {
                    this.db.search('notifies', {
                        'user': user.id
                    }, function(notify) {
                        notify.user = user.primaryNick;
                        notifies.push(notify);
                    }, function() {
                        var timezone = req.user.timezone || 'Europe/London';
                        notifies = _.sortBy(notifies, 'time').reverse();
                        _.each(notifies, function(v, k) {
                            v.time = moment(v.time).tz(timezone);
                        });

                        res.render('notifies', {
                            'server': server,
                            'notifies': notifies
                        });
                    });
                }.bind(this));
            }
        },

    };

    return pages;
};

exports.fetch = function(dbot) {
    return pages(dbot);
};
