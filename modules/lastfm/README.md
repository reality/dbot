## LastFM

Adds various LastFM functionalities.

### Description

This module provides a command which allows users to show stats of LastFM and such stuff.

### Dependencies

It has following dependencies:
+ [request](https://github.com/mikeal/request)
+ [async](https://github.com/caolan/async)
+ [moment](https://github.com/moment/moment)

### config.json

api_key and output prefix can be set.
Example:
```
{
    "dependencies": [ "profile" ],
    "api_key": "blah",
    "outputPrefix": "\u000315,5last.fm\u000f"
}
```

### Commands


#### ~lastfm [user]
Display all scrobbles of a user.
Example:
+ ~lastfm reality

#### ~scrobbliest
Displays the users with the most scrobbles.
Example:
+ ~scrobbliest

#### ~suggestion
Displays a suggestion based on the listened scrobbles.
Example:
+ ~suggestion

#### ~listening
Displays the currently/last played song of the posting user.
Example:
+ ~listening

#### ~taste [user]
Compares two users (the posting user and the defined user).
Example:
+ ~taste reality

#### ~tastiest
Displays the users that matches the most in music taste.
Example:
+ ~tastiest

#### ~artists [user]
Compares two users (the posting user and the defined user) and displays their matching artists.
Example:
+ ~artists reality

### TODO