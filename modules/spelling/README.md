## Spelling 

Fix your spelling.

### Description

Will attempt to correct a users' spelling by using the levenshtein distance
algorithm. One corrects the spelling of their previous message by simply posting
a message with their correction and an asterisk:

    > user: I am a tutrle.
    > user: *turtle
    user meant: I am a turtle.

The regular expression for this module also accepts two asterisks at the
beginning of the correction, or at the end; it also accepts several words as the
correction and deals with these fairly intelligently. Users may also attempt 
to correct another users like so:

    > userone: I am a tutrle.
    > usertwo: userone: *turtle
    > usertwo thinks userone meant: I am a turtle.
