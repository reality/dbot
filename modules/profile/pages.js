var pages = function(dbot) {
    var _ = require('underscore')._;
    var connections = dbot.instance.connections;

    return {
        '/profile/:connection/:user': function(req, res) {
            var connection = req.params.connection;
            var nick = req.params.user;

            dbot.api.users.resolveUser(connection, nick, function(err, user){
                if(user){
                    dbot.api.profile.getProfile(connection, user.primaryNick, function(err, user, profile){
                        if(!err){
                            var stats = [];

                            /*TODO(@samstudio8)
                             * stats functionality currently disabled as it has not been databanked
                             */
                            //var stats = dbot.api.stats.getUserChansStats(connection, user.primaryNick, [
                            //        "lines", "words", "lincent", "wpl", "in_mentions"]
                            //);

                            res.render('profile', {
                                'name': dbot.config.name,
                                'connection': connection,
                                'primary': user.primaryNick,
                                'profile': profile.profile,
                                'stats': stats.channels,
                            });
                        }
                        else{
                            res.render('error', {
                            });
                        }
                    });
                }
                else{
                    res.render('not_found', {
                    });
                }
            });
        },

        '/profile/:connection': function(req, res) {
            dbot.api.profile.getAllProfiles(function(profiles){
                var thumbnails = [];
                _.each(profiles, function(profile){
                    var nick = dbot.api.users.getUser(profile.id, function(err, user){
                        if(user){

                            /*TODO(@tmenari / @samstudio8)
                             * if username has a quote array and no avatar:
                             *    search their quote array for a jpg, png, jpeg or gif
                             *    set this as their new avatar
                             */

                            if(profile.profile.avatar){
                                thumbnails.push({
                                    "avatar": profile.profile.avatar,
                                    "nick": user.primaryNick
                                });
                            }
                        }
                    });
                });

                process.nextTick(function(){
                    thumbnails.sort(function(a, b) {
                        var x = a.nick.toLowerCase();
                        var y = b.nick.toLowerCase();
                        if(x > y) return 1;
                        if(x < y) return -1;
                        return 0;
                    });

                    res.render('profile_grid', {
                        'name': dbot.config.name,
                        'connection': req.params.connection,
                        'thumbnails': thumbnails,
                    });
                });
            });
        }
    }
};

exports.fetch = function(dbot) {
    return pages(dbot);
};
