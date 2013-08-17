var _ = require('underscore')._;

var commands = function(dbot) {
    var commands = {
        '~alias': function(event) {
            var nick = event.params[1].trim() || event.user;
            this.api.resolveUser(event.server, nick, function(user) {
                if(user) {
                    if(nick == user.primaryNick) {
                        var aliases = _.first(user.aliases, 10);
                        var including = 'including: ' + aliases.join(', ') + '.';

                        if(user.aliases.length != 0) {
                            event.reply(dbot.t('primary', { 
                                'user': nick,
                                'currentNick': user.currentNick,
                                'count': user.aliases.length,
                            }) + including);
                        } else {
                            event.reply(dbot.t('primary', { 
                                'user': nick, 
                                'currentNick': user.currentNick,
                                'count': user.aliases.length 
                            }).slice(0, -2) + ".");
                        }
                    } else {
                        event.reply(dbot.t('alias', { 
                            'alias': nick, 
                            'user': user.primaryNick
                        }));
                    }
                } else {
                    event.reply(dbot.t('unknown_alias', { 'alias': nick }));
                }
            });
        },

        '~addalias': function(event) {
            var nick = event.input[1],
                alias = event.input[2];

            this.api.resolveUser(event.server, nick, function(user) {
                if(user) {
                    if(!_.include(user.aliases, alias)) {
                        user.aliases.push(alias);
                        this.db.save('users', user.id, user, function(err) {
                            if(!err) {
                                event.reply(dbot.t('alias_added', {
                                    'user': user.primaryNick,
                                    'alias': alias
                                }));
                            }
                        });
                    } else {
                        event.reply(dbot.t('alias_exists', { 'alias': alias }));
                    }
                } else {
                    event.reply(dbot.t('unknown_alias', { 'alias': nick }));
                }
            }.bind(this));
        },

        '~removealias': function(event) {
            var alias = event.params[1];

            this.api.resolveUser(event.server, alias, function(user) {
                if(user) {
                    user.aliases = _.without(user.aliases, alias);
                    this.db.save('users', user.id, user, function(err) {
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

        '~setaliasparent': function(event) {
            var newPrimary = event.params[1].trim();
            this.api.resolveUser(event.server, newPrimary, function(user) {
                if(user && user.primaryNick != newPrimary) {
                    var newAlias = user.primaryNick;
                    user.primaryNick = newPrimary;
                    user.aliases = _.without(user.aliases, newPrimary);
                    user.aliases.push(newAlias);
                    this.internalAPI.updateChannelPrimaryUser(event.server, newAlias, newPrimary);

                    this.db.save('users', user.id, user, function(err) {
                        if(!err) {
                            event.reply(dbot.t('aliasparentset', {
                                'newParent': newPrimary,
                                'newAlias': newAlias
                            }));
                            dbot.api.event.emit('~setaliasparent', {
                                'server': event.server,
                                'alias': newAlias 
                            });
                        } 
                    });
                } else {
                    event.reply(dbot.t('unknown_alias', { 'alias': newPrimarj }));
                }
            }.bind(this));
        },

        '~mergeusers': function(event) {
            var primaryUser = event.params[1];
            var secondaryUser = event.params[2];

            this.api.resolveUser(event.server, primaryUser, function(user) {
                if(user) {
                    this.api.resolveUser(event.server, secondaryUser, function(oldUser) {
                        if(oldUser) {
                            user.aliases.push(oldUser.primaryNick);
                            user.aliases = _.union(user.aliases, oldUser.aliases);
                            this.internalAPI.mergeChannelUsers(oldUser, user);
                            this.db.del('users', oldUser.id, function(err) {
                                if(!err) {
                                    this.db.save('users', user.id, user, function(err) {
                                        if(!err) {
                                            event.reply(dbot.t('merged_users', { 
                                                'old_user': secondaryUser,
                                                'new_user': primaryUser
                                            }));
                                            dbot.api.event.emit('~mergeusers', [
                                                event.server,
                                                oldUser,
                                                user
                                            ]);
                                        }
                                    }.bind(this));
                                }
                            }.bind(this));
                        } else {
                            event.reply(dbot.t('unprimary_error', { 'nick': secondaryUser }));
                        }
                    }.bind(this));
                } else {
                    event.reply(dbot.t('unprimary_error', { 'nick': primaryUser }));
                }
            }.bind(this));
        }
    };
    
    commands['~alias'].regex = [/^~alias ([\d\w[\]{}^|\\`_-]+?)/, 2];
    commands['~setaliasparent'].regex = [/^~setaliasparent ([\d\w[\]{}^|\\`_-]+?)/, 2];
    commands['~mergeusers'].regex = [/^~mergeusers ([\d\w[\]{}^|\\`_-]+?)\s*?([\d\w[\]{}^|\\`_-]+?)/, 3];
    commands['~addalias'].regex = [/^~addalias ([\d\w[\]{}^|\\`_-]+?) ([\d\w[\]{}^|\\`_-]+?)$/, 3];
    
    commands['~setaliasparent'].access = 'moderator';
    commands['~mergeusers'].access = 'moderator';
    commands['~addalias'].access = 'moderator';
    commands['~removealias'].access = 'moderator';
    
    return commands;
};

exports.fetch = function(dbot) {
    return commands(dbot);
};
