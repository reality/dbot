## Steam

Adds various steam functionalities.

### Description

This module provides a command which allows users to seek and compare games inside the Steam library.

### Dependencies

It has following dependencies:
+ [request](https://github.com/mikeal/request)

### config.json

api_key and output prefix
For example:
```
{
    "api_key": "bleh",
    "outputPrefix": "\u00033steam\u000f"
}
```

### Commands


#### ~games [user]
Seeks the games of a user. If left blank, the posting users games will be displayed.
Example:
+ ~games reality
+ ~games

#### ~playing [user]
Displays the currently/last played game of a user. If left blank, the posting users game will be displayed.
Example:
+ ~playing reality
+ ~playing



### TODO