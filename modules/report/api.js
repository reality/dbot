var uuid = require('node-uuid'),
    _ = require('underscore')._,
    async = require('async');

var api = function(dbot) {
    var api = {
        'notify': function(type, server, user, cName, message) {
            var id = uuid.v4();
            this.db.save('notifies', id, {
                'id': id,
                'server': server,
                'type': type,
                'channel': cName,
                'user': user.id,
                'time': new Date().getTime(),
                'message': message
            }, function() {});

            var channel = dbot.instance.connections[server].channels[cName]; 
            var ops = _.filter(channel.nicks, function(user) {
                if(this.config.notifyVoice) {
                    return user.op || user.voice;
                } else {
                    return user.op; 
                }
            }, this);
            ops = _.pluck(ops, 'name');

            dbot.api.users.resolveChannel(server, cName, function(channel) {
                if(channel) {
                    var perOps = channel.op;
                    if(this.config.notifyVoice) perOps = _.union(perOps, channel.voice);

                    this.db.read('nunsubs', channel.id, function(err, nunsubs) {
                        async.eachSeries(ops, function(nick, next) {
                            dbot.api.users.resolveUser(server, nick, function(user) {
                                if(!_.include(user.mobile, user.currentNick)) {
                                    perOps = _.without(perOps, user.id);
                                }
                                if(nunsubs && _.include(nunsubs.users, user.id)) {
                                    ops = _.without(ops, user.currentNick);
                                }
                                next();
                            }); 
                        }, function() {
                            offlineUsers = perOps;
                            if(!_.include(this.config.noMissingChans, cName)) {
                                _.each(offlineUsers, function(id) {
                                    if(!this.pending[id]) this.pending[id] = [];
                                    this.pending[id].push({
                                        'time': new Date().getTime(),
                                        'channel': cName,
                                        'user': user.primaryNick,
                                        'message': message
                                    });
                                    this.pNotify[id] = true;
                                }.bind(this));
                            }
                            
                            message = this.internalAPI.formatNotify(type, server,
                                user, cName, message);
                            this.internalAPI.notify(server, ops, message);
                            if(_.has(this.config.chan_redirs, cName)) {
                                dbot.say(server, this.config.chan_redirs[cName], message);
                            }
                        }.bind(this)); 
                    }.bind(this));
                }
            }.bind(this));
        }, 

        'notifyUsers': function(server, users, message) {
            this.internalAPI.notify(server, users, message);
        }
    };
    return api;
};

exports.fetch = function(dbot) {
    return api(dbot);
};
