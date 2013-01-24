## Event

Emit events for whatever you want man idk.

### Description

This is a library module designed for other modules to use to emit various
events at any point, and also to attach functions to said events. These are
similar to command hooks, however their advantage is that they may be called
anywhere in your code; they are particularly useful when you want to attach a 
callback to a listener.

### API

#### addHook(eventName, callback)
This function will set a given callback to be executed every time the
emit API function is executed with the given event name. The arguments of your
callback are defined as an array in the emit call.

The best place to add hooks to commands is in the 'onLoad' function of your
module, as this ensures it will be run while all other modules are loaded so 
nothing will be missed.

#### emit(eventName, [ arguments ])
This function executes all of the functions associated with the given eventName, 
passing your given array of arguments.

For example, to emit an event when you detect a nick change:
    
    dbot.api.event.emit('nick_changed', [ event.server, newNick ]);
