## Wolfram Alpha Calculator

Calculates whatever you want.

### Description

This module provides a command which allows users to calculate whatever they want.

### Dependencies

It has following dependencies:
+ [node-wolfram](https://github.com/strax/node-wolfram)

### config.json

This module is ignorable.

appID has to be added into config.json. It can be obtained at
http://products.wolframalpha.com/developers/ for free.
`{
    "ignorable": true,
    "appID": "APP_ID_HERE"
}`

### Commands

#### ~calculate [(whatever)]

Example:
+ ~calculate (2+2)
+ ~calculate (x^2+2x+4)

### TODO