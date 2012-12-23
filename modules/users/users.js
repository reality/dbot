/**
 * Name: Users
 * Description: Track known users
 */
var users = function(dbot) {
    var knownUsers = dbot.db.knownUsers;
    var getServerUsers = function(event) {
        if(!knownUsers.hasOwnProperty(event.server)) {
            knownUsers[event.server] = {};
        }
        return knownUsers[event.server];    
    };

    dbot.instance.addListener('366', 'users', function(event) {
        var knownUsers = getServerUsers(event);
        for(var nick in event.channel.nicks) {
            if(!knownUsers.hasOwnProperty(nick) && event.channel.nicks.hasOwnProperty(nick)) {
                knownUsers[nick] = {};
            }
        }
    });

    return {
        'name': 'users',
        'ignorable': false,
            
        'listener': function(event) {
            var knownUsers = getServerUsers(event); 
            if(!knownUsers.hasOwnProperty(event.user)) {
                knownUsers[event.user] = {};
            }
        },
        'on': 'JOIN',
        
        'onLoad': function() {
            // Trigger updateNickLists to stat current users in channel
            var connections = dbot.instance.connections;
            for(var conn in connections) {
                if(connections.hasOwnProperty(conn)) {
                    connections[conn].updateNickLists();
                }
            }
        }
    };
};

exports.fetch = function(dbot) {
    return users(dbot);
};
