## Command

Handles the command execution logic for DBot.

### Description

1. Does the input match a command key in *dbot.commands* ?
2. Is there a quote category which matches the first part of the input
   (*~category*)?
3. Is there a command name similar to to the first part of the input (*~name*)
   in *dbot.commands*?

This is the only module which is force loaded, even if it's not specified in
the configuration file.
