/**
 * Name: Users
 * Description: Track known users
 */
var _ = require('underscore')._,
    moment = require('moment');

var users = function(dbot) {
    /*** Internal API ***/

    this.internalAPI = {
        // Create new user record
        'createUser': function(server, nick, callback) {
            var id = nick + '.' + server; 
            this.db.create('users', id, {
                'id': id,
                'server': server,
                'primaryNick': nick,
                'currentNick': nick,
                'aliases': []
            }, function(err, result) {
                if(!err) dbot.api.event.emit('new_user', [ result ]);
                callback(err, result);
            });
        }.bind(this),

        // Add new user alias
        'createAlias': function(alias, user, callback) {
            var id = alias + '.' + user.server;
            this.db.create('user_aliases', id, {
                'id': id,
                'alias': alias,
                'user': user.id
            }, function(err, result) {
                if(!err) {
                    user.aliases.push(alias);
                    console.log(user);
                    this.db.save('users', user.id, user, function() {
                      callback(null, result);
                      console.log('created alias');
                      dbot.api.event.emit('new_user_alias', [ result, alias ]);
                    });
                } else {
                    callback(true, null);
                }
            }.bind(this));
        }.bind(this),

        // Remove an alias record
        'removeAlias': function(server, alias, callback) {
            var id = alias + '.' + server;
            this.db.del('user_aliases', id, function(err) {
                callback(err);
            });
        }.bind(this),

        // Update current nick of user record
        'updateCurrentNick': function(user, newNick, callback) {
            user.currentNick = newNick;
            this.db.save('users', user.id, user, function(err, result) {
                if(!err) {
                    dbot.api.event.emit('new_current_nick', [ user, newNick ]);
                    callback(null, result);
                } else {
                    callback(true, null);
                }
            });
        }.bind(this),

        // Merge two user records and aliases
        'mergeUsers': function(oldUser, newUser, callback) {
            this.db.search('user_aliases', { 'user': oldUser.id }, function(alias) {
                if(alias.alias === newUser.primaryNick) {
                    this.db.del('user_aliases', alias.id, function(){});
                } else {
                    alias.user = newUser.id;
                    this.db.save('user_aliases', alias.id, alias, function(){});
                }
            }.bind(this), function(){
                this.internalAPI.createAlias(oldUser.primaryNick, newUser, function(){}); 
            }.bind(this));

            this.db.del('users', oldUser.id, function(err) {
                if(!err) {
                    dbot.api.event.emit('merged_users', [
                        oldUser,
                        newUser
                    ]);
                    callback(null);
                } else {
                    callback(true);
                }
            });
        }.bind(this),

        // Set a new nick as the parent for a user (so just recreate and merge)
        'reparentUser': function(user, newPrimary, callback) {
            this.internalAPI.createUser(user.server, newPrimary, function(err, newUser) {
                this.internalAPI.mergeUsers(user, newUser, function(err) {
                    callback(err);
                });
            }.bind(this));
        }.bind(this)
    };

    /*** Listener ***/

    // Track nick changes
    this.listener = function(event) {
        // Update current nick
        console.log(event);
        this.api.resolveUser(event.server, event.user, function(err, user) {
            if(user) {
                this.api.resolveUser(event.server, event.message, function(err, eUser) {
                    if(!eUser) {
                        this.internalAPI.createAlias(event.message, user, function(){});
                        this.internalAPI.updateCurrentNick(user, event.message, function(){});
                    } else if(user.id === eUser.id) {
                        this.internalAPI.updateCurrentNick(user, event.message, function(){});
                    }
                }.bind(this));
            }
        }.bind(this));
    }.bind(this);
    this.on = ['NICK'];

    /*** Pre-emit ***/

    this.onLoad = function() {
        // Create non-existing users and update current nicks
        var checkUser = function(event, done) {
            this.api.resolveUser(event.server, event.user, function(err, user) {
                if(!user) {
                    this.internalAPI.createUser(event.server, event.user, done);
                } else {
                    if(user.currentNick !== event.user) {
                        this.internalAPI.updateCurrentNick(user, event.user, done);
                    } else {
                        done(null, user);
                    }
                }
            }.bind(this));
        }.bind(this);

        var checkUserTime = function(user, done) {
          if(user && !_.has(user, 'lastUsed') || (_.has(user, 'lastUsed') && moment(user.lastUsed).diff(moment(user.lastUsed).add(1, 'day'), 'days') > 0)) {
            user.lastUsed = moment().unix(); 
            this.db.save('users', user.id, user, done);
          } else {
            done(null)
          }
        }.bind(this);

        dbot.instance.addPreEmitHook(function(event, callback) {
          if((event.user == 'telegram' || event.user == 'discord') && event.message) {
            var bit = event.message.split('> ')
            event.user = bit.shift().replace('<','').replace(/\x03\d{0,2}(,\d{0,2}|\x02\x02)?/g, '');
            event.message = bit.join('> ');
            event.params = event.message.split(' ');
          }
          callback(null);
        });

        dbot.instance.addPreEmitHook(function(event, callback) {
            if(event.user && _.include(['JOIN', 'PRIVMSG', 'QUIT'], event.action)) {
                checkUser(event, function(err, user) {
                  checkUserTime(user, function() {
                      event.rUser = user; 
                      callback(null);
                  });
                });
            } else {
                callback(null);
            }
        });
    }.bind(this);
};

exports.fetch = function(dbot) {
    return new users(dbot);
};
