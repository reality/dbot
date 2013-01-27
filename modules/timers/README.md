## Timers

Timers for fun and profit.

### Description

This is a utility module which allows other modules to more easily use timers to
execute functionality, as well as providing simple cron-type functionality for
timers.

### API

#### addTimer(interval, callback, [firstDate])
Execute the given callback every time *interval* (in ms) passes.

The firstDate parameter is a Date object used to sync a timer to a given point in 
time, allowing for cron-type functionality. For example, if you wanted to call a 
given function every day at 00:00, you would do the following:

    dbot.api.timers.addTimer(myCallback, 86400000, new Date([midnight tonight]));

This works like so:

1. Create a one-time timeout to be executed at the given firstDate (00:00, as
above).
2. Upon this timeout, your callback is executed. Then addTimer is called again
without the firstDate parameter, thus syncing a daily timer to be executed every 
day at 00:00.

The best place to create timers is in your module's onLoad function. Using this,
you may essentially create persistent jobs to be run at regular intervals while
your module is loaded..
