#!/bin/bash

git submodule init
git submodule update

npm install underscore request sandbox express moment jade@0.25

cd public/
wget http://twitter.github.com/bootstrap/assets/bootstrap.zip
unzip bootstrap.zip
rm bootstrap.zip

mkdir d3
cd d3
wget http://d3js.org/d3.v3.zip
unzip d3.v3.zip
rm d3.v3.zip

cd ..

cp config.json.sample config.json

echo 'Setup complete. Now edit config.json with your preferences and run the bot with "node run.js"'
