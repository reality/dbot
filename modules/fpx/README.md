## 500px

Adds various 500px functionality.

### Description

This module provides a command which allows users to search for a random popular 500px photo.

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


     ~r500px
Responds with a random popular 500px photo.
Example:
+ ~r500px

### TODO

Photo by user etc.
