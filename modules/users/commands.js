var _ = require('underscore')._;

var commands = function(dbot) {
    var commands = {
        '~alias': function(event) {
            var nick = event.params[1].trim();
            this.api.resolveUser(event.server, nick, function(user) {
                if(user) {
                    if(nick == user.primaryNick) {
                        var aliases = _.first(user.aliases, 10);
                        var including = 'including: ' + aliases.join(', ') + '.';

                        if(user.aliases.length != 0) {
                            event.reply(dbot.t('primary', { 
                                'user': nick,
                                'count': user.aliases.length,
                            }) + including);
                        } else {
                            event.reply(dbot.t('primary', { 
                                'user': nick, 
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
                    event.reply(dbot.t('unknown_alias', { 'alias': newPrimary }));
                }
            }.bind(this));
        },

        '~mergeusers': function(event) {
            var primaryUser = event.params[1];
            var secondaryUser = event.params[2];

            this.api.resolveUser(event.server, primaryUser, function(user) {
                if(user) {
                    this.api.resolveUser(event.server, secondaryUser, function(secondaryUser) {
                        if(secondaryUser) {
                            user.aliases.push(secondaryUser.primaryNick);
                            user.aliases.concat(secondaryUser.aliases);
                            this.db.del('users', secondaryUser.id, function(err) {
                                if(!err) {
                                    this.db.save('users', user.id, user, function(err) {
                                        if(!err) {
                                            this.updateChannels(event, secondaryUser, primaryUser);
                                            event.reply(dbot.t('merged_users', { 
                                                'old_user': secondaryUser,
                                                'new_user': primaryUser
                                            }));
                                            dbot.api.event.emit('~mergeusers', {
                                                'server': event.server,
                                                'secondary': secondaryUser
                                            });
                                        }
                                    }.bind(this));
                                }
                            }.bind(this));
                        } else {
                            event.reply(dbot.t('unprimary_error'));
                        }
                    }.bind(this));
                } else {
                    event.reply(dbot.t('unprimary_error'));
                }
            }.bind(this));
        }
    };
    
    commands['~alias'].regex = [/^~alias ([\d\w[\]{}^|\\`_-]+?)/, 2];
    commands['~setaliasparent'].regex = [/^~setaliasparent ([\d\w[\]{}^|\\`_-]+?)/, 2];
    commands['~mergeusers'].regex = [/^~mergeusers ([\d\w[\]{}^|\\`_-]+?)\s*?([\d\w[\]{}^|\\`_-]+?)/, 3];
    
    commands['~setaliasparent'].access = 'moderator';
    commands['~mergeusers'].access = 'moderator';
    
    return commands;
};

exports.fetch = function(dbot) {
    return commands(dbot);
};
