# Depressionbot IRC Bot

## Introduction

Depressionbot is an IRC bot which aims to be the fanciest IRC bot around - On
the general standard of software fanciness, dbot is rated as being '81% the same
as bathing in fine, fine grape juice.'

Please note that this documentation is not complete and is a work in progress, 
given I started it rather a long time after I began development of the project. 
Please don't judge me too harshly for this as I am, in fact, mildly allergic to
writing documentation.

Requirements: 

- Node JS
- [JSBot](http://github.com/reality/JSBot "JSBot"), a Javascript library which
  handles the IRC protocol.
- Various modules have their own requirements also.

### External Modules

JSBot and externally developed modules can be imported by running the following 
commands in the cloned repository:
	
	git submodule init
	git submodule update

## Modules:

### Admin

Various administration functionality such as banning users, hot-reloading the 
code and ordering him to talk. Note that commands added here are handled with
their own listener, rather than being part of the command logic which is handled
by the Command module. Functionality in this module can be slightly unsafe as
not much error checking on the input is performed.

TODO: Add summaries for each command in this module.

### Spelling 

Will attempt to correct a users' spelling by using the levenshtein distance
algorithm. One corrects the spelling of their previous message by simply posting
a message with their correction and an asterisk:

    > user: I am a tutrle.
    > user: *turtle
    user meant: I am a turtle.

The regular expression for this module also accepts two asterisks at the
beginning of the correction, or at the end; it also accepts several words as the
correction and deals with these fairly intelligently. Users may also attempt 
to correct another users like so:

    > userone: I am a tutrle.
    > usertwo: userone: *turtle
    > usertwo thinks userone meant: I am a turtle.

### JS

This module provides two commands which allow the execution of Javascript code.
For regular users, there is the *~js* command, which is completely sandboxed,
but can still be used for calculation and the like.

    > ~js Array(16).join('wat'-1) + " Batman!";
    'NaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaN Batman!'

This feature is fairly safe as the user doesn't have access to anything
dangerous, and is safe from infinite loops or locking DBot up because the code
which is run is killed if it does not finish within a short amount of time.

For administrators, the incredibly useful *~ajs* command is also available. The
input for this command is simply 'eval'-ed and therefore has full access to
DBot's memory. Of course, this is incredibly unsafe, but I find it rather fun;
remember to only give extremely trusted friends administrator access to DBot, as
there's nothing to stop them wiping the database or something similar - if
you're worried about that kind of thing, do not load this module.

However, it's useful for many things, such as administrative activity for 
which there isn't a command in the admin module. For example, you could hot-add
a new administrator like this:

    > ~ajs dbot.admin.push('batman');
    2

You can also use this for debugging, or even adding new commands while DBot is
running.
