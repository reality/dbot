## API

Creates external REST APIs for module API functions.

### Description

This module uses the web module to expose module API functionality externally
through a REST API. As it stands, it's only really useful for viewing various
information returned by API functions, as there is no system for API keys or
anything like that to protect against misuse of functionality which modifies
data.

To externalise an API function, two properties must be set on a particular API
function, like so:

    api['resolveUser'].external = true;
    api['resolveUser'].extMap = [ 'server', 'nick', 'callback' ];

The first, 'external' flag simply lets the API module know that this function is
intended to be exposed externally - and functions will always be considered not
to be externally available unless this flag is explicitly set.

The second is a mapping of parameters to the module. This should match the
function prototype given when the function is declared (unfortunately these
can't be mapped automatically because the closure use means we get 'native code'
returned and can't scan the function headers for the parameter names).

Then, to access this function remotely we can simply make a GET request to the
web counterpart to the internal API function path. So, internally you'd access 
the resolveUser function at _dbot.api.users.resolveUser_, we can get to it
externally with _/api/users/resolveUser_ - supplying parameters as they are
named in the extMap.

The response to the API call will be given in the form of JSON:

    {
        err: Error, such as 'API function not enabled for external access'
        data: API call response
    }

If there is a _callback_ parameter named in the extMap, then the API module
automatically hijacks this parameter and uses the data it's called with to
supply the response to the API call with data. If there is no callback
parameter, then it's a blocking API request and the response will be the return
value of the call.
