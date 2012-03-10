# Depressionbot IRC Bot

## Introduction

Depressionbot is an IRC bot which aims to be the fanciest IRC bot around - On
the general standard of software fanciness, dbot is rated as being '75% the same
as bathing in fine, fine grape juice.'

Requirements: 
    - Node JS
    - JSbot, the Javascript library I wrote to handle the IRC protocol and event
      listeners etc.
    - Various modules have their own requirements also.

## Modules:

### Quotes

### Admin

Various administration functionality such as banning users, hot-reloading the 
code and ordering him to talk. Note that commands added here are handled with
their own listener, rather than being part of the command logic which is handled
by the Command module.

### JS - Run Javascript code

This module provides two commands which allow the execution of Javascript code.
For regular users, there is the *~js* command, which is completely sandboxed,
but can still be used for calculation and the like.

Example:
    > ~js Array(16).join('wat'-1) + " Batman!";
    'NaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaN Batman!'

This feature is fairly safe as the user doesn't have access to anything
dangerous, and is safe from infinite loops or locking DBot up because the code
which is run is killed if it does not finish within a short amount of time.

For administrators, the incredibly useful *~ajs* command is also available. The
input for this command is simply 'eval'-ed and therefore has full access to
DBot's memory. Of course, this is incredibly unsafe, but I find it rather fun.
It's useful for administrative activity for which there isn't an in-built
command. For example, you could hot-add a new administrator like this:

    > ~ajs dbot.admin.push('batman');
    2

You can also use this for debugging, or even adding new commands while DBot is
running.
