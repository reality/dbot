## Users

Track users.

### Description

This module tracks users and their aliases through nick changes and all that
kind of thing. It's mainly a utility module for other modules to use. 

### Commands

#### ~alias [user]
If an alias is provided, this command will return the primary user for which
this is an alias for. If a primary user is provided, it will return a
confirmation of this fact and a count of how many aliases belong to the user.

#### ~setaliasparent [newparent]
Set a nick which is currently serving as an alias to the primary user, while
setting what was previously the primary user as an alias of the new primary
user. Requires moderator level access by default.

#### ~mergeusers [primaryuser] [secondaryuser]
This command merges two nicks which are recorded as primary users into one user.
The secondary user and all of their aliases will be merged under primaryuser.
Requires moderator level access by default.

### API

#### resolveUser(server, nick, callback)
This resolves a given nick to its primary user, returning false if no user
record is found in the store associated with the given nickname (either as a
primary nick or an alias). The callback is called with one argument, a _user_
object or false if no user was found.

#### getUser(uuid, callback)
Get a user by its uuid. Callback is called with one argument, a _user_ object or
false if no user was found by that uuid.

#### getChannel(server, channelName, callback)
This resolves a given server and channel name to a particular channel. The
callback is called with one argument, a _channel_ object or false if no channel
was found with the given name on the given server.

#### getRandomChannelUser(server, channel, callback)
Given a server name and a channel name, this gets a random user from that
channel. Callback is called with one argument, a _user_ object or false if no
channel was found from the given parameters.

#### getAllusers(callback)
Get a list of all users the bot currently knows about. Callback is called with
one argument, a list of user records.

### Data 

#### User Object

    {
        id: user uuid,
        primaryNick,
        currentNick: Current or last used nickname,
        server,
        channels: A list of names for channels this user has been in,
        aliases: A list of known aliases for this user
    }

#### Channel Object

    {
        id: channel uuid,
        server,
        name,
        users: A list of the uuids of users who are in this channel
    }

### Events

#### nick_changed(server, newNick)
This is executed when a new alias is added for a user.

#### new_user(server, nick)
This is executed when a new primary user is added to the known users DB.
