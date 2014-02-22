## Wikipedia

Adds various Wikipedia functionalities.

### Description

This module provides a command which allows users to search and obtain random wikipedia articles.

### Dependencies

It has following dependencies:
+ [WikiJs](https://github.com/rompetoto/wiki)

### config.json

This module is ignorable and an outPut prefix can be set.
```
{
    "ignorable": true,
    "outputPrefix": "wiki"
}
```

### Commands


#### ~wiki [article]
Searches Wikipedia for an article and responds with a summary of it.
Example:
+ ~wiki Albert Hoffmann

#### ~rwiki [article]
Responds with a summary of a random wikipedia article.
Example:
+ ~rwiki

### TODO
Add Wikipedia article URL.