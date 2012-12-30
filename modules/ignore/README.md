## Ignore

Ignore modules.

### Description

Commands with which users can choose to ignore listeners and commands from
certain modules persistently, by storing their choices in the database. This is
an interface for the JSBot ignoreTag functionality which actually implements 
the ignoration.

### Configuration

All modules may return with them an 'ignorable' property, which defines whether
or not their functionality may be ignored by users.

### Commands

#### ~ignore [module]
Ignore a given module. If the user does not specify a module, or provides an
invalid one a list of modules which are available to ignore will be given.

#### ~unignore [module]
Unignore a previously ignored module. If the user does not specify a module, or
provides an invalid choice a list of modules which are currently ignored will be
given.
