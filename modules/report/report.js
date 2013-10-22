var _ = require('underscore')._,
    async = require('async');

var report = function(dbot) {
    if(!dbot.db.pending) dbot.db.pending = {};
    if(!dbot.db.pNotify) dbot.db.pNotify = {};
    this.pending = dbot.db.pending;
    this.pNotify = dbot.db.pNotify;

    this.internalAPI = {
        'notify': function(server, users, message) {
            async.eachSeries(users, function(nick, next) {
                setTimeout(function() {
                    dbot.say(server, nick, message);
                    next();
                }, 1000);
            });
            dbot.api.event.emit('new_notify', [ message ]);
        },

        'formatNotify': function(type, server, user, channel, message) {
            var notifier = '[' + user.primaryNick + ']';

            if(_.has(this.config.colours, server)) {
                var colours = this.config.colours[server];

                notifier = '[' + colours['nicks'] + user.primaryNick + '\u000f]';
                if(_.has(colours.type, type)) {
                    type = colours['type'][type] + type + '\u000f';
                }
                if(_.has(colours['channels'], channel)) {
                    channel = colours['channels'][channel] +
                        channel + "\u000f";
                }

                _.each(message.match(/ @([\d\w*|-]+)/g), function(u) {
                    u = u.substr(1);
                    message = message.replace(u, colours['nicks'] + u + "\u000f");
                    notifier += '[' + colours['nicks'] + u.substr(1) + '\u000f]';
                });
            }

            return dbot.t('notify', {
                'type': type,
                'channel': channel,
                'notifier': notifier,
                'message': message
            });
        }.bind(this)
    };
 
    this.listener = function(event) {
        if(_.has(this.pending, event.rUser.id) && this.pNotify[event.rUser.id] === true && !_.include(event.rUser.mobile, event.rUser.currentNick)) {
            dbot.say(event.server, event.user, dbot.t('missed_notifies', {
                'user': event.rUser.primaryNick,
                'link': dbot.api.web.getUrl('notify/missing')
            }));
            this.pNotify[event.rUser.id] = false;
        }
    }.bind(this);
    this.on = 'JOIN';

    this.onLoad = function() {
        if(_.has(dbot.modules, 'web')) {
            dbot.api.web.addIndexLink('/notify', 'Notifications');
        }

        dbot.api.event.addHook('~mergeusers', function(server, oldUser, newUser) {
            this.db.search('notifies', { 'user': oldUser.id }, function(notify) {
                notify.user = newUser.id;
                this.db.save('notifies', notify.id, notify, function() {}); 
            }.bind(this), function() {}); 
        }.bind(this));

        dbot.api.event.addHook('new_current_nick', function(user) {
            if(_.has(this.pending, user.id) && this.pNotify[user.id] === true 
                    && !_.include(user.mobile, user.currentNick)) {
                dbot.say(user.server, user.currentNick, dbot.t('missed_notifies', {
                    'user': user.primaryNick,
                    'link': dbot.api.web.getUrl('notify/missing')
                }));
                this.pNotify[user.id] = false;
            }

        }.bind(this));
    }.bind(this);
};

exports.fetch = function(dbot) {
    return new report(dbot);
};
