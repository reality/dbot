## Admin

Administrator functionality.

### Description

Various administration functionality such as banning users, hot-reloading the 
code and ordering him to talk. Note that commands added here are handled with
their own listener, rather than being part of the command logic which is handled
by the Command module. Functionality in this module can be slightly unsafe as
not everything is thoroughly sanity checked.

### Commands

#### join [#channel]
Join the given channel.

#### part [#channel]
Leave the given channel.

#### opme [#channel]
Gives the caller ops in a given channel if possible. If called without a
channel, it will attempt to give the caller ops in the current channel.

#### greload
Perform a git pull, and then execute the 'reload' command. Saves a lot of time
updating!

#### reload
Reload all of the modules currently in use by DBot. By using this, all module
functionality should be reloadable and replaceable without having to restart the
bot or interrupt the connection to the server.

#### say [#channel] [message]
Have DBot post the given message in the given channel (uses the server from
which you are sending the message). You may replace channel with '@' to have him
post the message in the current channel. Channel may also be replaced with a
nick on the server.

#### load [module]
Load a new module. This works by adding a module name to the roster and then
triggering a reload of all modules, at which point the new module is actually
loaded by the standard DBot process.

#### unload [module]
Unload a currently loaded module. This removes the module, and then triggers a
reload of all modules.

#### ban [user] [command]
Ban a user from using a command. Command may be replaced with '\*,' which will
ban a user from use of all commands. Users banned from all commands will still
be subject to module listeners.

#### unban [user] [command]
Unban a user from using a given command. If a user was previously banned using
the '\*' wildcard, they may also be unbanned from such by replacing command with
an asterisk here as well.
