Futuron: Lightcycle AI Battles
==============================

Getting started
---------------

Prerequisites:
* [Git](http://git-scm.com/)
* [Node.js](http://nodejs.org/)
* [NPM](https://npmjs.org/)
* [Grunt](http://gruntjs.com/)
* [Bower](http://bower.io/)

First steps:
* Clone the repository
* Run `npm install`
* Run `bower install`
* Run `grunt server --force` (--force is unnecessary if you have Compass)

Futuron terminal
----------------

Futuron is controlled via the on-page command line terminal. The `help` command lists
the following options:

* `rez <spec1> [<specN>...]` Used to bring in bot AIs onto the Grid.

  Each `spec` is resolved to a JavaScript file in a three-step process:
  * As a local file name without extension, or
  * As a IP address, using default path /scripts/bot.js, or (1)
  * As a full URL referencing the bot script file (1)
  
  A bot's code is wrapped in a Web Worker with some helpers, detailed in the bot
  template file in app/scripts/bot.js.
  
  (1) The bot file must be served with CORS enabled
  
* `derez <id1> [<idN>...]` Used to remove bot AIs from the Grid.

  Each `id` must correspond to an existing bot ID. Derezzing bots causes their
  associated Web Workers to terminate.
  
* `run` Runs a Futuron battle, pitting the bot AIs against one another.

  Last man standing wins.
  
* `halt` Can be used to halt a battle, for example when only one bot remains.

* `help` Display the command line help

Developing your bot
-------------------

Futuron comes with a bot AI template, app/scripts/bot.js. You can modify this file
(or make copies to test several variants) to implement a better strategy than the
default (go right, always).

The bot AI is wrapped inside a Web Worker. Since debugging Web Workers can be a bit
tedious, dummy versions of the bot helpers are included in the Futuron page itself. This
will make interactive development of custom helper functions easier.

Using Web Workers allows for multiple threads, enabling concurrent strategy computation
for each bot.

The bot strategy function needs to balance computational intelligence with speed, since
each bot is allowed only a fixed time frame for each move. This value defaults currently
to 100 milliseconds.

Sharing results for battles
---------------------------

Once several bots are developed, they can be battle for supremacy on a shared Grid.

Futuron comes with a simple Python script (app/serve.py) which can be used from that
location to serve your bot files. The `rez` bot resolution mechanism will search for
bots from the default template location, when using the IP address resolution step.

The provided Python script enables CORS (Access-Control-Allow-Origin: \*).

If you want to minify/uglify your bot code first, serve it with CORS enabled form the
dist directory or another location of your choice.

Once every bot is served from a known location, you can use `rez` with IP address or full
URL to bring in the bots for battle!
