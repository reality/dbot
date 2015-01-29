var uuid = require('node-uuid'),
    _ = require('underscore')._,
    async = require('async');

var api = function(dbot) {
    var api = {
        'notify': function(type, server, user, cName, message) {
            var id = uuid.v4(),
                tags = []; 
                _.each(message.match(/(#\w+)/g), function(match) {
                    tags.push(match.toLowerCase());
                });
            this.db.save('notifies', id, {
                'id': id,
                'server': server,
                'type': type,
                'channel': cName,
                'user': user.id,
                'time': new Date().getTime(),
                'message': message,
                'tags': tags 
            }, function(err, notify) {
                dbot.api.event.emit('new_notify', [ notify, user.primaryNick ]);
            });

            var channel = dbot.instance.connections[server].channels[cName]; 
            if(_.has(dbot.modules, 'atheme')) {
                dbot.api.atheme.getChannelFlags(server, cName, function(err, flags) {
                    var ops = _.map(flags, function(f, k) {
                                   var staff = (f.indexOf('O') !== -1);
                                   if(this.config.notifyVoice && !staff) {
                                        staff = (f.indexOf('V') !== -1);
                                   }
                                   if(staff) {
                                        return k;
                                   }
                               }.bind(this));
		ops = _.without(ops, undefined);
console.log(ops);
                    this.db.read('nunsubs', cName + '.' + server, function(err, nunsubs) {
                        if(nunsubs) {
                            _.each(nunsubs.users, function(user) {
                                var uPart = user.split('.')[0];
                                if(_.include(ops, uPart)) {
console.log('removing ' + uPart);
                                    ops = _.without(ops, uPart);
                                }
                            });
                        }

                        var offlineOps = {};
                        async.each(ops, function(op, done) {
                            dbot.api.users.isOnline(server, cName, op, function(err, user, online) {
				if(user) {
                                if(!err && !online) offlineOps[op] = user;
                                if(user.currentNick !== op) {
                                    ops = _.without(ops, op);
                                    ops.push(user.currentNick);
                                }
				}
                                done();
                            });
                        }, function() {
                            // Queue notifies for offline ops
                            _.each(offlineOps, function(op) {
                                if(!this.pending[op.id]) this.pending[op.id] = [];
                                this.pending[op.id].push({
                                    'time': new Date().getTime(),
                                    'channel': cName,
                                    'user': user.id,
                                    'message': message
                                });
                                this.pNotify[op.id] = true;
                            }, this);

                            // Send notifies to online ops
                            ops = _.difference(ops, _.keys(offlineOps));
                            message = this.internalAPI.formatNotify(type, server,
                                        user, cName, message);
                            this.internalAPI.notify(server, ops, message);
                            if(_.has(this.config.chan_redirs, cName)) {
                                dbot.say(server, this.config.chan_redirs[cName], message);
                            }
                        }.bind(this));
                    }.bind(this));
                }.bind(this));
            } else {
                var channel = dbot.instance.connections[server].channels[cName]; 
                var ops = _.filter(channel.nicks, function(user) {
                    if(this.config.notifyVoice) {
                        return user.op || user.voice;
                    } else {
                        return user.op; 
                    }
                }, this);
                ops = _.pluck(ops, 'name');
			message = this.internalAPI.formatNotify(type, server,
			    user, cName, message);
			this.internalAPI.notify(server, ops, message);
			if(_.has(this.config.chan_redirs, cName)) {
			    dbot.say(server, this.config.chan_redirs[cName], message);
			}
            }
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
