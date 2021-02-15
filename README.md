# lookinglassjs

lookinglass.follower.js contains the main logic for the sessions (the model's called navigation-action on the server). The storage used is SessionStorage, but the interface is written so that it's easy to change that.

At the beginning of the file there are directives for jslint6.
Then there are utility functions, and then there is the section for autovetture.

Each function with prefix take- represents one single page. Each action in it is aimed at gathering objects.

The entry point is at `$(document).ready(function(){`, where per each page there is a specific action. The pages are identified by the title.
