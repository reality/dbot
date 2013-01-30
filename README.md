# Depressionbot IRC Bot

## Introduction

Depressionbot is an IRC bot which aims to be the fanciest IRC bot around - On
the general standard of software fanciness, dbot is statistically rated as being 
'82% the same as bathing in fine, fine grape juice.'

Please note that this documentation is not complete and is a work in progress, 
given I started it rather a long time after I began development of the project. 
Please don't judge me too harshly for this as I am, in fact, mildly allergic to
writing documentation.

Requirements: 

- Node JS
- [JSBot](http://github.com/reality/JSBot "JSBot"), a Javascript library which
  handles the IRC protocol
- Underscore JS library
- Various modules have their own requirements also.

### External Modules

JSBot and externally developed modules can be imported by running the following 
commands in the cloned repository:
	
	git submodule init
	git submodule update

You can also install depressionbot via the nifty Bash script, by invoking ``./install.sh``.
