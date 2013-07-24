## Github 

Grabs interesting data from the GitHub API.

### Description

This module for [depressionbot](https://github.com/reality/depressionbot) takes some interesting information about Github and parses it in a pleasing manner.

### Configuration
#### defaultrepo
When repository information is lacking from the command, this repository will be used.
#### sortorder
Defines the behaviour of ~issue when no arguments are given. Options are ``created``, ``updated``, or ``comments``.
### Commands
#### ~commits
Returns the number of commits in the repository of the current depressionbot instance.
#### ~gstatus
Returns the [current status of Github](https://status.github.com), and a message explaining the current state of affairs.
#### ~issue (user/repo) [id]
Gives information about the isse pecified, from the default repository if one is not explicitly stated.
#### ~milestone [milestone name]
Returns milestone progress for any given milestone, with a link to the milestone in question.
#### ~repo (repo name)
Returns information about the repo given as a parameter. The repo should be specified as ``user/name``; for example, ``twitter/snowflake``.
#### ~repocount [user]
Returns the number of public Github repositories for the specified user.
### Dependencies
* [request](https://github.com/mikeal/request/):``$ npm install request``
