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

### Command

This handles the command execution logic for DBot.

1. Does the input match a command key in *dbot.commands* ?
2. Is there a quote category which matches the first part of the input
   (*~category*)?
3. Is there a command name similar to to the first part of the input (*~name*)
   in *dbot.commands*?

This is the only module which is force loaded, even if it's not in the
configuration.

### Quotes

This is the original reason that DBot was created, stores and displays quotes.

Commands:

- _~q category_ - Display a random quote from a given category.
- _~qadd category=newquote_ - Add a new quote to the database.
- _~qstats_ - Show a list of the biggest quote categories.
- _~qsearch category needle_ - Search for a quote in a given category.
- _~rmlast [category]_ - Remove the last quote added to a given category, or the
  last quote added.
- _~rm category quote_ - Remove a given quote from the given category.
- _~qcount category_ - Show the number of quotes stored in the given category.
- _~rq_ - Show a random quote from a random category.
- _~d_ - Show a quote from the category which matches the bot's name.
- _~link category_ - Create a link to the page on the web interface which displays the
  given category's quotes.
- _~qprune_ - Delete empty quote categories.

Unfortunately, this module is fairly highly coupled with certain other areas of
the program. I am working on this, but note, for example, that one can still
access quotes with the *~category* syntax even if the quotes module isn't
loaded.

### Admin

Various administration functionality such as banning users, hot-reloading the 
code and ordering him to talk. Note that commands added here are handled with
their own listener, rather than being part of the command logic which is handled
by the Command module. Functionality in this module can be slightly unsafe as
not much error checking on the input is performed.

### JS - Run Javascript code

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
