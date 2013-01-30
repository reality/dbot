var pages = function(dbot) {
    var _ = require('underscore')._;
    var connections = dbot.instance.connections;

    return {
        '/profile/:connection/:user': function(req, res) {
            var connection = req.params.connection;
            var user = dbot.cleanNick(req.params.user);

            var primary = dbot.api.users.resolveUser(connection, user, true);
            //var profile = dbot.api.profile.getProfile(primary);
            var profile = dbot.db.profiles[connection][primary.toLowerCase()].profile;
            var stats = dbot.api.stats.getUserChansStats(connection, primary.toLowerCase(), [
                    "lines", "words", "lincent", "wpl", "in_mentions"]
            );

            res.render('profile', {
                'name': dbot.config.name,
                'connection': connection,
                'primary': primary,
                'profile': profile,
                'stats': stats.channels,
            });
        },

        '/profile/:connection': function(req, res) {
            var connection = req.params.connection;
            var profiles = dbot.db.profiles[connection];

            // TODO: Clean up
            _.each(profiles, function(profile) {
                if(_.has(dbot.db.quoteArrs, profile.profile.primary) && !profile.profile.avatar) {
                    var category = dbot.db.quoteArrs[profile.profile.primary];
                    var avatar = _.find(category, function(quote) {
                        return quote.match(/(\.jpg|\.png|\.jpeg)$/i);
                    });
                    if(avatar) profile.profile.avatar = avatar;
                }
            });

            var nicks = [];
            for (var p in profiles) {
              if (profiles.hasOwnProperty(p) && profiles[p].profile.avatar) {
                nicks.push(p);
              }
            }
            nicks.sort(function(a, b) {
              var x = profiles[a].profile.primary.toLowerCase();
              var y = profiles[b].profile.primary.toLowerCase();
              if(x > y) return 1;
              if(x < y) return -1;
              return 0;
            });

            res.render('profile_grid', {
                'name': dbot.config.name,
                'connection': connection,
                'nicks': nicks,
                'profiles': profiles,
            });
        }
    }
};

exports.fetch = function(dbot) {
    return pages(dbot);
};
