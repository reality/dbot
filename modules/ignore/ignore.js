/**
 * Module Name: Ignore
 * Description: Handles commands in which users can choose to ignore listeners
 * and commands from certain modules. It also populates the JSBot instance with
 * this information, since that actually performs the ignorance. Also provides
 * commands for moderators to choose the bot to ignore certain channels.
 */
var _ = require('underscore')._,
    databank = require('databank'),
    uuid = require('node-uuid'),
    NoSuchThingError = databank.NoSuchThingError;

var ignore = function(dbot) {
    this.internalAPI = {
        'isUserImpeded': function(user, item, by, callback) {
            this.api.getUserIgnores(user, function(err, ignores) {
                var isImpeded = false;
                if(!err && ignores) {
                    if(_.has(dbot.commands, item) && !_.include(ignores[by], item)) {
                        item = dbot.commands[item].module;
                    }
                    if(_.include(ignores[by], item)) {
                        isImpeded = true;
                    }
                }
                callback(isImpeded);
            });
        }.bind(this)
    };

    var commands = {
        '~ignore': function(event) {
            var module = event.params[1];
            var ignorableModules = _.chain(dbot.modules)
                .filter(function(module, name) {
                    return dbot.config.modules[module].ignorable === true;
                })
                .pluck('name')
                .value();

            if(_.isUndefined(module)) {
                event.reply(dbot.t('ignore_usage', {
                    'user': event.user, 
                    'modules': ignorableModules.join(', ')
                }));
            } else {
                if(module == '*' || _.include(ignorableModules, module)) {
                    this.api.getUserIgnores(event.rUser, function(err, ignores) {
                        if(!ignores) {
                            ignores = {
                                'id': event.rUser.id,
                                'ignores': [],
                                'bans': []
                            };
                        }

                        if(!_.include(ignores.ignores, module)) {
                            ignores.ignores.push(module);
                            this.db.save('ignores', event.rUser.id, ignores, function(err) {
                                if(!err) {
                                    dbot.instance.ignoreTag(event.user, module);
                                    event.reply(dbot.t('ignored', {
                                        'user': event.user, 
                                        'module': module
                                    }));
                                }
                            });
                        } else {
                            event.reply(dbot.t('already_ignoring', { 'user': event.user }));
                        }
                    }.bind(this));
                } else {
                    event.reply(dbot.t('invalid_ignore', { 'user': event.user }));
                }
            }
        }, 

        '~unignore': function(event) {
            var module = event.params[1];

            this.api.getUserIgnores(event.rUser, function(err, ignores) {
                if(err || !ignores || _.isUndefined(module)) {
                    if(ignores) {
                        event.reply(dbot.t('unignore_usage', {
                            'user': event.user, 
                            'modules': ignores.ignores.join(', ')
                        }));
                    } else {
                        event.reply(dbot.t('empty_unignore_usage', {
                            'user': event.user
                        }));
                    }
                } else {
                    if(_.include(ignores.ignores, module)) {
                        ignores.ignores = _.without(ignores.ignores, module);
                        this.db.save('ignores', event.rUser.id, ignores, function(err) {
                            if(!err) {
                                dbot.instance.removeIgnore(event.user, module)
                                event.reply(dbot.t('unignored', {
                                    'user': event.user, 
                                    'module': module
                                }));
                            }
                        });
                    } else {
                        event.reply(dbot.t('invalid_unignore', { 'user': event.user }));
                    }
                }
            }.bind(this));
        },

        '~ban': function(event) {
            var nick = event.input[1],
                item = event.input[2];

            if(module == '*' || _.include(dbot.config.moduleNames, item) || _.include(dbot.commands, item)) {
                dbot.api.users.resolveUser(event.server, nick, function(err, user) {
                    this.api.getUserIgnores(user, function(err, ignores) {
                        if(!err) {
                            if(!ignores) {
                                ignores = {
                                    'id': user.id,
                                    'ignores': [],
                                    'bans': [] 
                                };
                            }

                            if(!_.include(ignores.bans, item)) {
                                ignores.bans.push(item);
                                this.db.save('ignores', user.id, ignores, function(err) {
                                    if(!err) {
                                        event.reply(dbot.t('banned_success', {
                                            'user': event.user, 
                                            'banned': nick,
                                            'module': item 
                                        }));
                                    }
                                });
                            } else {
                                event.reply(dbot.t('already_banned', {
                                    'user': event.user,
                                    'banned': nick
                                }));
                            }
                        } else {
                          event.reply(err);
                        }
                    }.bind(this));
                }.bind(this));
            } else {
                event.reply(dbot.t('invalid_ban', { 'user': event.user }));
            }
        },

        '~unban': function(event) {
            var nick = event.input[1],
                item = event.input[2];

            dbot.api.users.resolveUser(event.server, nick, function(err, user) {
                this.api.getUserIgnores(user, function(err, ignores) {
                    if(err || !ignores) {
                        event.reply(dbot.t('invalid_unban', {
                            'user': event.user,
                            'banned': nick 
                        }));
                    } else {
                        if(_.include(ignores.bans, item)) {
                            ignores.bans = _.without(ignores.bans, item); 
                            this.db.save('ignores', user.id, ignores, function(err) {
                                event.reply(dbot.t('unbanned_success', {
                                    'user': event.user,
                                    'banned': nick,
                                    'module': item
                                }));
                            });
                        } else {
                            event.reply(dbot.t('invalid_unban', {
                                'user': event.user,
                                'banned': nick
                            }));
                        }
                    }
                }.bind(this));
            }.bind(this));
        },

        '~ignorechannel': function(event) {
            var channelName = event.input[1],
                module = event.input[2];

            // Ignoring the value of 'ignorable' at the moment
            if(module == '*' || _.include(dbot.config.moduleNames, module)) {
                var channel = false;

                this.db.search('channel_ignores', { 
                    'server': event.server,
                    'name': channelName
                }, function(result) {
                    channel = result; 
                }, function(err) {
                    if(!channel) {
                        var id = uuid.v4();
                        channel = {
                            'id': id,
                            'server': event.server,
                            'name': channelName,
                            'ignores': []
                        };
                    }

                    if(!_.include(channel.ignores, module)) {
                        channel.ignores.push(module);
                        this.db.save('channel_ignores', channel.id, channel, function(err) {
                            dbot.instance.ignoreTag(channel.name, module);
                            event.reply(dbot.t('ignoring_channel', {
                                'module': module,
                                'channel': channelName
                            }));
                        }); 
                    } else {
                        event.reply(dbot.t('already_ignoring_channel', {
                            'module': module,
                            'channel': channelName
                        }));
                    }
                }.bind(this));
            } else {
                event.reply(dbot.t('module_not_exist', { 'module': module }));
            }
        },

        '~unignorechannel': function(event) {
            var channelName = event.input[1],
                module = event.input[2],
                channel = false;

            this.db.search('channel_ignores', {
                'server': event.server,
                'name': channelName
            }, function(result) {
                channel = result;                
            }, function(err) {
                if(channel && _.include(channel.ignores, module)) {
                    channel.ignores = _.without(channel.ignores, module);
                    this.db.save('channel_ignores', channel.id, channel, function(err) {
                        dbot.instance.removeIgnore(channel.name, module);
                        event.reply(dbot.t('unignoring_channel', {
                            'module': module,
                            'channel': channelName
                        }));
                    });
                } else {
                    event.reply(dbot.t('not_ignoring_channel', {
                        'module': module,
                        'channel': channelName
                    }));
                }
            }.bind(this));
        }
    };

    commands['~ban'].regex = [/^ban ([^ ]+) ([^ ]+)$/, 3];
    commands['~unban'].regex = [/^unban ([^ ]+) ([^ ]+)$/, 3];
    commands['~ignorechannel'].regex = [/^ignorechannel ([^ ]+) ([^ ]+)$/, 3];
    commands['~unignorechannel'].regex = [/^unignorechannel ([^ ]+) ([^ ]+)$/, 3];

    commands['~ban'].access = 'moderator';
    commands['~unban'].access = 'moderator';
    commands['~ignorechannel'].access = 'moderator';
    commands['~unignorechannel'].access = 'moderator';

    this.commands = commands;

    this.onLoad = function() {
        dbot.instance.clearIgnores();

        this.db.scan('ignores', function(ignores) {
            dbot.api.users.getUser(ignores.id, function(err, user) {
                if(user) {
                    _.each(ignores.ignores, function(module) {
                        dbot.instance.ignoreTag(user.currentNick, module);
                    });
                }
            });
        }, function(err) { });

        this.db.scan('channel_ignores', function(channel) {
            _.each(channel.ignores, function(module) {
                dbot.instance.ignoreTag(channel.name, module);
            });
        }, function(err) { });

        dbot.api.event.addHook('new_current_nick', function(user, oldNick) {
            this.api.getUserIgnores(user, function(err, ignores) {
                if(ignores) {
                    _.each(ignores.ignores, function(module) {
                        dbot.instance.removeIgnore(oldNick, module);
                        dbot.instance.ignoreTag(user.currentNick, module);
                    });
                }
            }.bind(this));
        }.bind(this));
    }.bind(this);
};

exports.fetch = function(dbot) {
    return new ignore(dbot);
};
