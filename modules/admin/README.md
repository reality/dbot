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

#### version [module]
Shows the git version of the currently loaded revision of DBot. If module is
provided, it will attempt to get the revision of the module (this is only useful
for submodules).

#### status [module]
Show the recorded status for a given module, this is helpful for debugging
issues when loading or for checking if a module is loaded.

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

#### setconfig [path] [value]
Set a config value at path to be a certain value persistently. For example, if
you want to change the web module to listen on port 9001, you can run _setconfig
web.webPort 9001_.

#### pushconfig [path] [value]
Push a new value to an existing config array. For example, if you want to add
the user 'batman62' to the DBot moderators, you can run _pushconfig moderators
batman62_.

#### showconfig [path]
Use this to explore and view the DBot configuration. If called without a path,
it will display the config keys in the root; if the path is a subkey, it will
show all config keys under that key. If you give it an actual key, it'll show you
the currently effective config value.
