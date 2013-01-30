## JS

Run JavaScript.

### Description

This module provides two commands which allow the execution of Javascript code
from the bot.

### Commands

#### ~js [code]
For regular users, there is the *~js* command, which is completely sandboxed,
but can still be used for calculation and the like.

    > ~js Array(16).join('wat'-1) + " Batman!";
    'NaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaN Batman!'

This feature is fairly safe as the user doesn't have access to anything
dangerous, and is safe from infinite loops or locking DBot up because the code
which is run is killed if it does not finish within a short amount of time.

#### ~ajs [code]
For administrators, the incredibly useful *~ajs* command is also available. The
input for this command is simply 'eval'-ed and therefore has full access to
DBot's memory. Of course, this is incredibly unsafe, but I find it rather fun;
remember to only give extremely trusted friends administrator access to your
DBot instance, as there's nothing to stop them wiping the database or probably
even your hard drive - if you're worried about that kind of thing, do not load 
this module.

However, it's useful for many things, such as administrative activity for 
which there isn't a command in the admin module. For example, you could hot-add
a new administrator like this:

    > ~ajs dbot.admin.push('batman');
    2

You can also use it for debugging, or even adding new commands while DBot is
running.
