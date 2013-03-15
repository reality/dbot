## Finger 

Retrieves user information from a remote server.

### Description
Uses the ``finger`` command to retrieve limited information on users.

### Configuration
#### server
The server that the bot will finger. Be advised that the module may not function correctly on different servers that have a configuration uunlike the one this module was designed for.

### Commands
####~finger [username]
Returns the real name of the user specified.
### Dependencies
* ``npm install request``
