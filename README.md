Craigslist Highlighter
=======================

[Craigslist Highlighter](http://nickknowlson.com/projects/craigslist-highlighter/) home page. Has screenshots!

Details
---

This script helps highlight things you're looking for when searching for apartments or
housing on craigslist. 

It will follow each link on the search page and
scan the individual listing's body page for the keywords you enter. When it
finds them, it will retrieve them, append them to the end of the individual
listing, and highlight them green or red for positive or negative.  You can pick
the terms you are looking for at the top of the page, the script integrates its
options panel into the search ui for craigslist.

See the screenshots above for an example of what this looks like. 

Install
---

This script is only supported for Firefox and Greasemonkey at the moment. 

 1. Install [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/)
 2. Go to the [userscripts page](http://userscripts.org/scripts/show/110921) for
    Craigslist Highlighter and click the Install button in the top right corner.

Features
---

 * Finds months and highlights them in blue.
 * Location, location, location. Finds good and bad locations based on your
   input and highlights the listing in green or red. It highlights the location
   in a deeper green or red for easier scanning.
 * Fields where you can enter your own desirable traits, such as 'garden' or
   'skylight'. The only real difference between these and the location boxes is the
   location boxes highlight the listing based on their result.
 * Checkboxes for other common desirable things, like fireplaces, balconies and
   dishwashers. These act just like predefined lists of  good and bad traits.
 * Smarter pet searching. If you check 'cats' it will search for a list of
   phrases involving cats and pets. It catches ones that would be filtered out
   by using the normal craigslist cats and dogs checkboxes, and can identify
   many bad matches (e.g. 'no cats')
 * If you enter a maximum (and optionally minimum) value, it will put emphasis
   on the lower prices and fade out the higher ones. For best results enter both
   minimum and maximum values.
 * Integrates smoothly into craigslist by emulating its style. Easy to disable.
