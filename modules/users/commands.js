var _ = require('underscore')._;

var commands = function(dbot) {
    var commands = {
        '~alias': function(event) {
            var knownUsers = this.getServerUsers(event.server),
                alias = event.params[1].trim();

            if(_.include(knownUsers.users, alias)) {
                var aliases = this.api.getAliases(event.server, alias);
                var aliasCount = aliases.length;

                var aliases = _.first(aliases, 10);
                var including = 'including: ';
                for(var i=0;i<aliases.length;i++) {
                    including += aliases[i] + ', ';
                }
                including = including.slice(0, -2) + '.';

                event.reply(dbot.t('primary', { 
                    'user': alias, 
                    'count': aliasCount 
                }) + including); 
            } else if(_.has(knownUsers.aliases, alias)) {
                event.reply(dbot.t('alias', { 
                    'alias': alias, 
                    'user': knownUsers.aliases[alias] 
                }));
            } else {
                event.reply(dbot.t('unknown_alias', { 'alias': alias }));
            }
        },

        '~setaliasparent': function(event) {
            var knownUsers = this.getServerUsers(event.server);
            var newParent = event.params[1];

            if(_.has(knownUsers.aliases, newParent)) {
                var newAlias = knownUsers.aliases[newParent]; 

                // Replace user entry
                knownUsers.users = _.without(knownUsers.users, newAlias);
                knownUsers.users.push(newParent);

                // Replace channels entries with new primary user
                this.updateChannels(event, newAlias, newParent);

                // Remove alias for new parent & add alias for new alias
                delete knownUsers.aliases[newParent];
                knownUsers.aliases[newAlias] = newParent;

                // Update aliases to point to new primary user
                this.updateAliases(event, newAlias, newParent);

                event.reply(dbot.t('aliasparentset', { 
                    'newParent': newParent, 
                    'newAlias': newAlias 
                }));

                return {
                    'server': event.server,
                    'alias': newAlias
                };
            } else {
                event.reply(dbot.t('unknown_alias', { 'alias': newParent }));
            }
            return false;
        },

        '~mergeusers': function(event) {
            var knownUsers = this.getServerUsers(event.server);
            var primaryUser = event.params[1];
            var secondaryUser = event.params[2];

            if(_.include(knownUsers.users, primaryUser) && _.include(knownUsers.users, secondaryUser)) {
                knownUsers.users = _.without(knownUsers.users, secondaryUser);
                knownUsers.aliases[secondaryUser] = primaryUser;
                this.updateAliases(event, secondaryUser, primaryUser);
                this.updateChannels(event, secondaryUser, primaryUser);

                event.reply(dbot.t('merged_users', { 
                    'old_user': secondaryUser,
                    'new_user': primaryUser
                }));
                
                return {
                    'server': event.server,
                    'primary': primaryUser,
                    'secondary': secondaryUser
                };
            } else {
                event.reply(dbot.t('unprimary_error'));
            }
            return false;
        } 
    };

    commands['~setaliasparent'].access = 'moderator';
    commands['~mergeusers'].access = 'moderator';
    
    return commands;
};

exports.fetch = function(dbot) {
    return commands(dbot);
};
