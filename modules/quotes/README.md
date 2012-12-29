## Quotes

Stores and displays quotes.

### Description

This is the original reason that DBot was created, stores and displays quotes.

### Configuration

#### rmLimit: 10
Amount of quotes which can be removed before admin approval is required.

### Commands

#### ~q [category]
Display a random quote from a given category.

#### ~qadd [category] = [quote]
Add a new quote to the database.

#### ~qstats
Show a list of the biggest quote categories.

#### ~qsearch [category] = [needle]
Search a category for quotes including the given text.

#### ~rmlast [category]
Remove the last quote added to a given category.

#### ~rmstatus
Show how many quotes are currently in the removal cache, and whether they will
be randomly removed.

#### ~rm [category] = [quote]
Remove a given quote from the given category.

#### ~qcount [category]
Show the number of quotes stored in the given category, or if called without a
category it will show the total number of quotes in the database.

#### ~rq
Show a random quote from the database.

#### ~link [category]
Show a link to the page on the web interface which shows this category's quotes.

### Admin-only Commands

#### ~rmconfirm
Confirm that the quotes currently in the removal cache are okay to be removed,
and permanently delete them.

#### ~rmdeny
Re-instate the quotes that are currently in the removal cache back into the main
quote database.

### Removal Spam Protection

When quotes are removed using either the ~rm or ~rmlast commands, the quotes are
removed from the main database, but are stored in a removal cache which is cleared 
out ten minutes from the last time a quote was removed from the database. If the 
number of quotes removed from the database reaches a certain limit (as per rmLimit 
in config, default 10) then the counter is removed and the cache will not be deleted 
automatically. In such a case, a DBot admin needs to either run the ~rmconfim command
to have the removal cache cleared, or ~rmdeny to re-instate all of the quotes in
the removal cache back into the main quote database. This is to stop mass
removal from the database without limiting the user interface.
