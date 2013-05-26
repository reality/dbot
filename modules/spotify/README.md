## spotify

Various Spotify functionality.

### Description
This module posts information on Spotify links, as well as providing Spotify
search functionality.

## Commands

### ~spotify [query]
Search spotify for a song.

### ~syt [youtube link]
Attempt to get a Spotify link from a YouTube link. If no link is provided with
the commands, it will attempt to use the last link posted in the channel.

## API

#### spotifySearch(query, callback)
Run a search query on Spotify. If no results are found, the callback will pass
false. If a result is found, the callback takes two arguments: data about the
found track, and a link to the track.

### Hooks

#### link
Posts information about a Spotify link when one is posted in a channel.
