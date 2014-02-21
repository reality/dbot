## 500px

Adds various 500px functionality.

### Description

This module provides a command which allows users to search for a random popular 500px photo.
Users have to set 500px username with ~set [500px username]

### Dependencies

It has following dependencies:
+ [node-500px](https://github.com/ro-ka/node-500px)

### config.json

ignorable and consumerKey has to be configurated. It can be obtained at http://developers.500px.com
```
{
    "ignorable": true,
    "api_key": "CONSUMERKEY_HERE"
}
```

### Commands

####~r500px
Responds with a random popular 500px photo.
Example:
+ ~r500px

####~500px [user]
Responds with data of a user, if user left blank posters data will be displayed.
Example:
+ ~500px
+ ~500px reality

####~last500px [user]
Responds with the last photo of a user, if user left blank posters last photo will be displayed.
Example:
+ ~last500px
+ ~last500px reality

### TODO
