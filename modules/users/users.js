/**
 * Name: Users
 * Description: Track known users
 */
var _ = require('underscore')._;

var users = function(dbot) {
    this.knownUsers = dbot.db.knownUsers;
    this.getServerUsers = function(server) {
        var knownUsers = this.knownUsers;
        if(!_.has(knownUsers, server)) {
            knownUsers[server] = { 'users': [], 'aliases': {}, 'channelUsers': {} };
        }
        if(!_.has(knownUsers[server], 'channelUsers')) {
            knownUsers[server].channelUsers = {};
        }
        return knownUsers[server];    
    };

    this.updateAliases = function(event, oldUser, newUser) {
        var knownUsers = this.getServerUsers(event.server);
        _.each(knownUsers.aliases, function(user, alias) {
            if(user == oldUser) {
                knownUsers.aliases[alias] = newUser;
            }
        }, this);
    };

    this.updateChannels = function(event, oldUser, newUser) {
        var channelUsers = this.getServerUsers(event.server).channelUsers;
        channelUsers = _.each(channelUsers, function(channel, channelName) {
            channelUsers[channelName] = _.without(channel, oldUser);
            channelUsers[channelName].push(newUser);
        }, this);
    };
        
    this.listener = function(event) {
        var knownUsers = this.getServerUsers(event.server); 
        var nick = event.user;

        if(event.action == 'JOIN') {
            if(!_.has(knownUsers.channelUsers, event.channel.name)) {
                knownUsers.channelUsers[event.channel.name] = [];
            }
            var channelUsers = knownUsers.channelUsers[event.channel.name];

            if(this.api.isKnownUser(event.server, nick)) {
                nick = this.api.resolveUser(event.server, nick);
            } else {
                knownUsers.users.push(nick);
                dbot.api.event.emit('new_user', [ event.server, nick ]);
            }

            if(!_.include(channelUsers, nick)) {
                channelUsers.push(nick);
            }
        } else if(event.action == 'NICK') {
            var newNick = event.params.substr(1);
            if(!this.api.isKnownUser(newNick)) {
                knownUsers.aliases[newNick] = this.api.resolveUser(event.server, event.user);
                dbot.api.event.emit('nick_change', [ event.server, newNick ]);
            }
        }
    }.bind(this);
    this.on =  ['JOIN', 'NICK'];
    
    this.onLoad = function() {
        // Trigger updateNickLists to stat current users in channel
        dbot.instance.addListener('366', 'users', function(event) {
            var knownUsers = this.getServerUsers(event.server);
            if(!_.has(knownUsers.channelUsers, event.channel.name)) {
                knownUsers.channelUsers[event.channel.name] = [];
            }
            var channelUsers = knownUsers.channelUsers[event.channel.name];

            _.each(event.channel.nicks, function(nick) {
                nick = nick.name;
                if(this.api.isKnownUser(event.server, nick)) {
                    nick = this.api.resolveUser(event.server, nick);
                } else {
                    knownUsers.users.push(nick);
                    dbot.api.event.emit('new_user', [ event.server, nick ]);
                }
                if(!_.include(channelUsers, nick)) {
                    channelUsers.push(nick);
                }
            }, this);
        }.bind(this));

        var connections = dbot.instance.connections;
        _.each(connections, function(connection) {
            connection.updateNickLists(); 
        });
    };
};

exports.fetch = function(dbot) {
    return new users(dbot);
};
