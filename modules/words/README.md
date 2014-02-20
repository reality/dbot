## words

Adds various functionality for words.

### Description

This module provides commands which allows users to have various functionality for words,
such as defining, getting the etymology and jimble the letters.
To achieve that, this module seeks the wordnik database.

### Dependencies

It has following dependencies:
+ [node-wordnik](https://github.com/cpetzold/node-wordnik)

### config.json

api_key : most likely the wordnik developer homepage

### Commands


#### ~define [word]

Seeks wordnik database and replys with a definition.
Example:
+ ~define Spaghetti

#### ~etymology [word]

Seeks wordnik database and replys with its etymology.
Example:
+ ~etymology Spaghetti

#### ~jimble [word]

Jimbles the letters of a word.
Example:
+ ~jimble Spaghetti

### TODO