## Nickserv

Check nick authentication with nickserv.

### Description

This module provides an API function which allows you to check the
authentication status of a given nick. This is useful for checking that someone
is actually who they say they are, and not an imposter; for example, this API
function will be used in the command module to check if a user is authed before
running commands which require elevated access (if the useNickserv configuration
option is set).

### Configuration

#### Servers

This is a data structure which allows you to define the data behaviour for
nickservs on various different servers.

    _nc_: {
        _matcher_: This is a regular expression which will be used to match login
        status responses from nickserv.
        _acceptableState_: The numeric response from nickserv which will be
        accepted as meaning the user is authenticated.
        _infoCommand_: The command to be sent to nickserv inquiring about user
        authentication status.
    }

The server name should match that of the one configured in the main DBot
config.json file. Also note that the name of the services bot these commands
will be sent to will also be taken from the 'nickserv' configuration option in
the server definition in the main config file.

### API

#### auth(server, nick, callback)
This will send a message to the configured nickserv bot inquiring as to the
login status of the given user. The callback will be called with one argument,
true or false depending on the nickserv's response as to whether the nick is
authed or not.
