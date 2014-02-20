## Soundcloud

Adds various Soundcloud functionality.

### Description

This module provides a command which allows users to search Soundcloud for a song.

### Dependencies

It has following dependencies:
+ [request](https://github.com/mikeal/request)

### config.json

client_id and output prefix can be set.
```
{
    "client_id": "CLIENT _ID_HERE,
    "outputPrefix": "\u000307soundcloud\u000f",
    "dependencies": [ "link" ]
}
```

### Commands


#### ~soundcloud [song]
Searches Soundcloud for a song.
Example:
+ ~soundcloud TNGHT

### TODO
