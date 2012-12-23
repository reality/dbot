/**
 * Name: Users
 * Description: Track known users
 */
var users = function(dbot) {
    var knownUsers = dbot.db.knownUsers;
    var getChanUsers = function(event) {
       if(!knownUsers.hasOwnProperty(event.server)) {
            knownUsers[event.server] = {};
        }
        var serverUsers = knownUsers[event.server];    

        if(!serverUsers.hasOwnProperty(event.channel.name)) {
            serverUsers[event.channel.name] = []; 
        }
        return serverUsers[event.channel.name];
    };

    dbot.instance.addListener('366', 'users', function(event) {
        var chanUsers = getChanUsers(event);
        for(var nick in event.channel.nicks) {
            if(!chanUsers.include(nick) && event.channel.nicks.hasOwnProperty(nick)) {
                chanUsers.push(nick);
            }
        }
    });

    return {
        'name': 'users',
        'ignorable': false,
            
        'listener': function(event) {
            var chanusers = getChanUsers(event); 
            if(!chanUsers.include(event.user)) {
                chanUsers.push(event.user);
            }
        },
        'on': 'JOIN'
    };
};

exports.fetch = function(dbot) {
    return users(dbot);
};
