# Web

Web interface

## Description

It's a web interface for DBot. What of it?

## Requirements
###Express and Jade@0.25
```
npm install express
npm install jade@0.25
```
###Express Patch
Express currently needs to be patched, edit ~/node_modules/express/lib/express.js as thus;
```
  52 for (var key in connect.middleware) {                                           
**53   if( !Object.prototype.hasOwnProperty(key) ) {                                 
  54     Object.defineProperty(                                                      
  55         exports                                                                 
  56       , key                                                                     
  57       , Object.getOwnPropertyDescriptor(connect.middleware, key));              
**58   }                                                                             
  59 } 
```
###Twitter Bootstrap
```
cd depressionbot/public/
wget http://twitter.github.com/bootstrap/assets/bootstrap.zip
unzip bootstrap.zip
rm bootstrap.zip
```
###d3.js
```
cd depressionbot/public/
mkdir d3
cd d3
wget http://d3js.org/d3.v3.zip
unzip d3.v3.zip
rm d3.v3.zip
```
