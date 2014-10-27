var _ = require('underscore')._;

var commands = function(dbot) {
    var commands = {
        '~alias': function(event) {
            var nick = event.params[1] || event.user;
            this.api.resolveUser(event.server, nick, function(err, user) {
                if(user) {
                    this.api.getUserAliases(user.id, function(err, aliases) {
                        var including = _.first(aliases, 10).join(', ');

                        if(nick !== user.primaryNick) {
                            event.reply(dbot.t('alias', { 
                                'alias': nick, 
                                'user': user.primaryNick
                            }));
                        }

                        if(aliases.length === 0) {
                            event.reply(dbot.t('primary_no_alias', { 
                                'user': user.primaryNick,
                                'currentNick': user.currentNick
                            }));
                        } else {
                            event.reply(dbot.t('primary', { 
                                'user': user.primaryNick,
                                'currentNick': user.currentNick,
                                'count': aliases.length,
                                'including': including
                            }));
                        }
                    });
                } else {
                    event.reply(dbot.t('unknown_alias', { 'alias': nick }));
                }
            }.bind(this));
        },

        '~addalias': function(event) {
            var nick = event.params[1],
                alias = event.params[2];

            this.api.resolveUser(event.server, nick, function(err, user) {
                if(user) {
                    this.api.resolveUser(event.server, alias, function(err, aUser) {
                        if(!aUser) {
                            this.internalAPI.createAlias(alias, user, function(err) {
                                event.reply(dbot.t('alias_added', {
                                    'user': user.primaryNick,
                                    'alias': alias
                                }));
                            });
                        } else {
                            event.reply(dbot.t('alias_exists', {
                                'alias': alias,
                                'user': aUser.primaryNick
                            }));
                        }
                    });
                } else {
                    event.reply(dbot.t('unknown_alias', { 'alias': nick }));
                }
            }.bind(this));
        },

        '~setaliasparent': function(event) {
            var newPrimary = event.params[1];
            this.api.resolveUser(event.server, newPrimary, function(err, user) {
                if(user) {
                    if(user.primaryNick !== newPrimary) {
                        this.internalAPI.reparentUser(user, newPrimary, function() {
                            event.reply(dbot.t('alias_parent_set', {
                                'newParent': newPrimary,
                                'newAlias': user.primaryNick
                            }));
                        });
                    } else {
                        event.reply(dbot.t('already_primary', { 'user': newPrimary }));
                    }
                } else {
                    event.reply(dbot.t('unknown_alias', { 'alias': newPrimary }));
                }
            }.bind(this));
        },

        '~rmalias': function(event) {
            var alias = event.params[1];

            this.api.resolveUser(event.server, alias, function(err, user) {
                if(user) { // Retrieving user record via alias proves existence of alias record
                    this.internalAPI.removeAlias(event.server, alias, function(err) {
                        event.reply(dbot.t('alias_removed', {
                            'primary': user.primaryNick,
                            'alias': alias
                        }));
                    });
                } else {
                    event.reply(dbot.t('unknown_alias', { 'alias': nick }));
                }
            }.bind(this));
        },

        '~mergeusers': function(event) {
            var oldNick = event.params[1],
                newNick = event.params[2];

            this.api.resolveUser(event.server, oldNick, function(err, oldUser) {
                if(oldUser) {
                    this.api.resolveUser(event.server, newNick, function(err, newUser) {
                        if(newUser && newUser.id !== oldUser.id) {
                            this.internalAPI.mergeUsers(oldUser, newUser, function() {
                                 event.reply(dbot.t('merged_users', {
                                     'old_user': oldNick,
                                     'new_user': newNick 
                                 }));
                            });
                        } else {
                            event.reply(dbot.t('unknown_alias', { 'alias': newNick }));
                        }
                    }.bind(this));
                } else {
                    event.reply(dbot.t('unknown_alias', { 'alias': oldNick }));
                }
            }.bind(this));
        }
    };
    commands['~setaliasparent'].access = 'moderator';
    commands['~addalias'].access = 'moderator';
    commands['~rmalias'].access = 'moderator';
    commands['~mergeusers'].access = 'moderator';

    return commands;
};

exports.fetch = function(dbot) {
    return commands(dbot);
};
