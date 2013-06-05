## Report

Report users

### Description
This module provides a command which allows users to report other users in a
channel to the operators of the channel, as well as posting an alert in the
administrative channel. It can be done either anonymously or publicly in the
channel.

### Commands

#### ~report [#channel] [username] [reason for reporting]
Report a user in a channel for a reason. This command can either be run publicly
in a channel or anonymously in a PM to the bot. The result of using this command
will be that all of the users which are currently marked as operators in the
reporting channel will receive a PM telling them a user has been reported, by
whom, in which channel and why. If there is an administrative channel for the
reporting channel (e.g. ##channel), the report will be posted there as well.

#### ~notify [#channel] [message]
Notify staff of a channel of a message. This can be run in either PM or in the
channel. If notifyVoice is set, voiced users will also receive notifications.
