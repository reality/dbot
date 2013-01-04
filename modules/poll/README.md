## Poll

Pollers gonna poll.

### Description
This module allows creation of and voting in polls, with associated
functionality.

Note that while in terms of the interface all votes are anonymous, users' 
voting choices are stored in the database for the purpose of users being 
able to change their votes. Therefore an admin can technically go delving in 
the database to see users' voting choices.

### Commands

#### ~newpoll [pollname] options=[each,poll,option] [Poll Description]
Creates a new poll with the given name, options and descriptions. From this
point people will be able to use the ~vote command to cast their vote in the
poll.

#### ~addoption [pollname] [newoption]
Using this command you can add a given option to a poll you are the creator of.

#### ~rmoption [pollname] [optiontoremove]
Using this command you can remove a given option from a poll you are the creator
of.

#### ~vote [pollname] [option]
Cast your vote for the given option in the given poll. If you have already cast
your vote in the given poll, your vote will be changed to the new option you
have provided. 

#### ~pdesc [pollname]
Show the full description for a given poll name along with its available voting
options.
