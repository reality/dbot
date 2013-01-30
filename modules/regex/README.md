## Regex

Apply regex and that.

### Description

Allows you to run regex replaces on both your own and others messages. One may
run a regex on their own last message like so:

    > user: I like turtles
    > user: s/turtles/pizza/

One may run a regex on another user's last message simple by hilighting the nick
before the pattern:

    > batman: I like TURTLES
    > user: batman: s/turtles/pizza/i

Note: As this is JS regex, the second part of the regex is actually just a
string and therefore some regex features aren't available (such as lookaheads).
On a related note, the regex flags available for use are limited to i and g.
