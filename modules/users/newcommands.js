var _ = require('underscore')._;

var commands = function(dbot) {
    this.commands = {
        '~alias': function(event) {
            var nick = event.input[1] || event.user;
            this.api.resolveUser(event.server, nick, function(err, user) {
                if(user) {
                    this.api.getUserAliases(user.id, function(err, aliases) {
                        var including = _.first(aliases, 10).join(', ');

                        if(nick === user.primaryNick) {
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
                        } else {
                            event.reply(dbot.t('alias', { 
                                'alias': nick, 
                                'user': user.primaryNick
                            }));
                        }
                    });
                } else {
                    event.reply(dbot.t('unknown_alias', { 'alias': nick }));
                }
            }.bind(this));
        },

        '~addalias': function(event) {
            var nick = event.input[1],
                alias = event.input[2];

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
        }
    };
};
