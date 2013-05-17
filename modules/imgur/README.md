## imgur

Various imgur functionality.

### Description

Posts information on imgur links which are pasted into the channel and provides
functionality to generate a random imgur link.

### Commands

#### ~ri
Generate a random imgur image and post a link to it in the channel.

### API

#### getRandomImage(callback)
Generate a random imgur image by generating random slugs and then testing for
their existence until it finds one which exists (and hasn't been deleted).
Callback is given with two parameters, the URL of the generated image, and the
slug for the generated image.

#### getImageInfoString(slug, callback)
Return a string containing info about the image with the given slug from the
imgur API. Callback is called with one argument, the info string.

#### getImageInfo(slug, callback)
Return data from the imgur API on an image with the given slug. Callback is
called with one argument, the information returned by the API.

### Hooks

#### link
Posts information about an imgur link when one is linked in the channel.
