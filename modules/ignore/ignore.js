/**
 * Module Name: Ignore
 * Description: Handles commands in which users can choose to ignore listeners
 * and commands from certain modules. It also populates the JSBot instance with
 * this information, since that actually performs the ignorance. Also provides
 * commands for moderators to choose the bot to ignore certain channels.
 */
var _ = require('underscore')._,
    databank = require('databank'),
    NoSuchThingError = databank.NoSuchThingError;

var ignore = function(dbot) {
    var commands = {
        '~ignore': function(event) {
            var module = event.params[1];
            var ignorableModules = _.chain(dbot.modules)
                .filter(function(module, name) {
                    return dbot.config[module].ignorable === true;
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
                    dbot.api.users.resolveUser(event.server, event.user, function(user) {
                        this.db.read('ignores', user.id, function(err, ignores) {
                            if(err == NoSuchThingError) {
                                this.db.create('ignores', user.id, {
                                    'id': user.id,
                                    'ignores': [ module ]
                                }, function(err, result) {
                                    if(!err) {
                                        dbot.instance.ignoreTag(event.user, module);
                                        event.reply(dbot.t('ignored', {
                                            'user': event.user, 
                                            'module': module
                                        }));
                                    }
                                });
                            } else {
                                if(!_.include(ignores.ignores, module)) {
                                    ignores.ignores.push(module);
                                    this.db.save('ignores', user.id, function(err) {
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
                            }
                        });
                    });
                } else {
                    event.reply(dbot.t('invalid_ignore', { 'user': event.user }));
                }
            }
        }, 

        '~unignore': function(event) {
            var ignoredModules = [];
            if(_.has(dbot.db.ignores, event.user)) {
                ignoredModules = dbot.db.ignores[event.user];
            }
            var module = event.params[1];

            if(_.isUndefined(module)) {
                event.reply(dbot.t('unignore_usage', {
                    'user': event.user, 
                    'modules': ignoredModules.join(', ')
                }));
            } else {
                if(_.include(ignoredModules, module)) {
                    dbot.db.ignores[event.user].splice(dbot.db.ignores[event.user].indexOf(module), 1);
                    dbot.instance.removeIgnore(event.user, module)
                    event.reply(dbot.t('unignored', { 
                        'user': event.user, 
                        'module': module
                    }));
                } else {
                    event.reply(dbot.t('invalid_unignore', { 'user': event.user }));
                }
            }
        },

        '~ban': function(event) {
            var user = event.params[1];
            var module = event.params[2];

            if(_.isUndefined(user) || _.isUndefined(module)) {
                event.reply(dbot.t('ban_usage', {'user': event.user}));
                return;
            }
 
            if(module == '*' || _.include(dbot.config.moduleNames, module) || _.include(dbot.commands, module)) {
                if(_.has(dbot.db.bans, user) && _.include(dbot.db.bans[user], module)) {
                    event.reply(dbot.t('already_banned', {
                        'user': event.user,
                        'banned': user
                    }));
                    return;
                }

                if(_.has(dbot.db.bans, event.params[1])) {
                    dbot.db.bans[event.params[1]].push(module);
                } else {
                    dbot.db.bans[event.params[1]] = [module];
                }

                event.reply(dbot.t('banned_success', {
                    'user': event.user,
                    'banned': user,
                    'module': module
                }));
            } else {
                event.reply(dbot.t('invalid_ban', {'user': event.user}));
            }
        },

        '~unban': function(event) {
            var bannedModules = [];

            var user = event.params[1];
            var module = event.params[2];

            if(_.isUndefined(user) || _.isUndefined(module)) {
                event.reply(dbot.t('unban_usage', {'user': event.user}));
            } else {
                if(_.has(dbot.db.bans, user) && _.include(dbot.db.bans[user], module)) {
                    dbot.db.bans[user].splice(dbot.db.bans[user].indexOf(module), 1);

                    event.reply(dbot.t('unbanned_success', {
                        'user': event.user,
                        'banned': user,
                        'module': module
                    }));
                } else {
                    event.reply(dbot.t('invalid_unban', {
                        'user': event.user,
                        'banned': user
                    }));
                }
            }
        },

        '~ignorechannel': function(event) {
            var channel = ((event.params[1] == '@') ? event.channel.name : event.params[1]);
            var module = event.params[2];

            // Ignoring the value of 'ignorable' at the moment
            if(module == '*' || _.include(dbot.config.moduleNames, module)) {
                if(!_.has(dbot.db.ignores, channel)) dbot.db.ignores[channel] = [];
                if(!_.include(dbot.db.ignores[channel], module)) {
                    dbot.db.ignores[channel].push(module);
                    dbot.instance.ignoreTag(channel, module);
                    event.reply(dbot.t('ignoring_channel', {
                        'module': module,
                        'channel': channel
                    }));
                } else {
                    event.reply(dbot.t('already_ignoring_channel', {
                        'module': module,
                        'channel': channel
                    }));
                }
            } else {
                event.reply(dbot.t('module_not_exist', { 'module': module }));
            }
        },

        '~unignorechannel': function(event) {
            var channel = ((event.params[1] == '@') ? event.channel.name : event.params[1]);
            var module = event.params[2];

            if(!_.has(dbot.db.ignores, channel)) dbot.db.ignores[channel] = [];
            if(_.include(dbot.db.ignores[channel], module)) {
                dbot.db.ignores[channel] = _.without(dbot.db.ignores[channel], module); 
                dbot.instance.removeIgnore(channel, module);
                event.reply(dbot.t('unignoring_channel', {
                    'module': module,
                    'channel': channel
                }));
            } else {
                event.reply(dbot.t('not_ignoring_channel', {
                    'module': module,
                    'channel': channel
                }));
            }
        }
    };

    commands['~ban'].access = 'moderator';
    commands['~unban'].access = 'moderator';
    commands['~ignorechannel'].access = 'moderator';
    commands['~unignorechannel'].access = 'moderator';

    this.commands = commands;

    this.onLoad = function() {
        dbot.instance.clearIgnores();
        _.each(dbot.db.ignores, function(ignores, item) {
            _.each(ignores, function(ignore) {
                    dbot.instance.ignoreTag(item, ignore);
            }, this);
        }, this);
    };
};

exports.fetch = function(dbot) {
    return new ignore(dbot);
};
