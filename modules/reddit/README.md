## Reddit

Various Reddit functionality

### Description

This module provides Reddit related functionality, which is currently limited to
reading various links, but will be expanded in future to include stuff like
monitoring posts and creating its own.

### API

#### getSubredditInfo(name, callback)
Get information about a subreddit from the Reddit API. Callback takes one
argument, the data returned from the API.

#### getPostInfo(name, callback)
Get information about a post from the Reddit API. Callback takes one argument,
the data returned from the API about the post.

#### getCommentInfo(post, name, callback)
Get information about a particular comment in a particular post. Callback takes
one argument, information about the given comment.

### Hooks

#### link
Posts a summary when either a subreddit, a post or a comment is linked in a
channel.
