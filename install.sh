#!/bin/bash
cat LICENCE
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

cd ../..

if [ ! -f config.json ];
then
    echo 'Creating configuration file...'
    cp config.json.sample config.json
    vim config.json
fi

read -p "Setup complete. Run depressionbot now? [y/N]"
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo 'Okay. To run the bot, use "node run.js"'
    exit
fi
node run.js

