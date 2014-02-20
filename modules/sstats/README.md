## sstats

Adds various stats functionality.

### Description

This module provides a command which allows users to print stats, such as how many words etc..

### Dependencies

It has following dependencies:
+ [async](https://github.com/caolan/async)

### config.json

database type and curses can be set.
```
{
    "dbType": "redis",
    "dependencies": [ "users" ],
    "curses": [ "s***", "f***" ]
}
```

### Commands


#### ~words [user]
Displays how many words a user wrote.
Example:
+ ~words reality

#### ~lines [user]
Displays how many lines a user wrote.
Example:
+ ~lines reality

#### ~loudest [channel]
Displays the users with the most lines written.
Example:
+ ~loudest #tripsit

#### ~uncouth [channel]
Displays the users with the most curses written.
Example:
+ ~uncouth #tripsit

#### ~shoutiest [user]
Displays the users with the most capital words written.
Example:
+ ~shoutiest #tripsit

#### ~wordiest [channel]
Displays the users with the most words written.
Example:
+ ~wordiest #tripsit

#### ~clines [user]
Displays how many lines a user wrote in all channels.
Example:
+ ~clines reality

#### ~last [user]
Displays when the user was last seen.
Example:
+ ~last reality

#### ~trackword [word]
Adding a word to being tracked.
Example:
+ ~trackword derp

#### ~word [word]
Displays how often a word was written in all channels.
Example:
+ ~word derp

#### ~wordusers [word]
Displays how often and by whom a word was written.
Example:
+ ~wordusers derp

### TODO