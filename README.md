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
