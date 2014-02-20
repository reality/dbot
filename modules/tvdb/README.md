## theTVDB

Addes various TVDB funtionalities.

### Description

This module provides a command which allows users to search for series on theTVDB.com.

### Dependencies

It has following dependencies:
+ [node-tvdb](https://github.com/enyo/node-tvdb)

### config.json

ignorable and apiKey can be set. A key can be requested at http://thetvdb.com/?tab=apiregister
```
{
    "ignorable": true,
    "apiKey": "blah"
}
```

### Commands


#### ~tvdb [series]
Searches for series on theTVDB
Example:
+ ~tvdb How I met your Mother

### TODO