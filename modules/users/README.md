## Users

Track users.

### Description

This module tracks users and their aliases through nick changes and all that
kind of thing. It's mainly a utility module for other modules to use. It's 
also totally !insaned.

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

#### resolveUser(server, nick, [useLowerCase])
This resolves a given nick to its primary user and returns it. 

Note that if the useLowerCase argument is set to true, it will do a lower-case 
search, however it will return the username in its properly capitalised form, so
remember to lower case the return value if you are using lower case values as
keys.

#### resolveUser(server, user)
Return whether a user is known either as an alias or a primary user.

#### isPrimaryUser(server, nick)
Return whether a nick is known as a primary user.

#### getAliases(server, user)
Return a list of aliases for a given primary user.

#### isOnline(server, user, channel, useLowerCase)
Return whether a user is online in a given channel on the given server.

### Events

#### nick_changed(server, newNick)
This is executed when a new alias is added for a user.

#### new_user(server, nick)
This is executed when a new primary user is added to the known users DB.
