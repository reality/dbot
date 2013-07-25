# DBot IRC Bot

## Introduction

DBot is an IRC bot which aims to be the fanciest IRC bot around - On
the general standard of software fanciness, dbot is statistically rated as being 
'82% the same as bathing in fine, fine grape juice.'

Please note that this documentation is not complete and is a work in progress, 
given I started it rather a long time after I began development of the project. 
Please don't judge me too harshly for this as I am, in fact, mildly allergic to
writing documentation.

## Getting Started

To get started with DBot, you first need to decide on a database system to use.
DBot uses the [databank](http://github.com/e14n/databank) library, and each
module can be configured to use any database driver databank supports in its
respective config.json file. There is currently no default database driver
option.

The default for all modules is the 'redis' driver, and you can simply install
the Redis server to get going.

Once you have that set up, you can install DBot's dependencies, configure and 
run the bot for the first time with the following command:

```
sh install.sh
```

## Upgrading

If you have used a previous version of DBot, then you can migrate most data
using the [dbot-migrate](https://github.com/reality/dbot-migrate) module.
Instructions on how to run this are included in the repository - remember to
remove db.json after migration, otherwise the instance will be slow!
