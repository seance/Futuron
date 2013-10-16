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

* `rez` <spec1> [<specN>...] Used to bring in bot AIs onto the Grid.

  Each `spec` is resolved to a JavaScript file in a three-step process:
  * As a local file name without extension, or
  * As a IP address, using default path /scripts/bot.js, or
  * As a full URL referencing the bot script file
  
  A bot's code is wrapped in a Web Worker with some helpers, detailed in the bot
  template file in app/scripts/bot.js.
  
* `derez <id1> [<idN>...]` Used to remove bot AIs from the Grid.

  Each `id` must correspond to an existing bot ID. Derezzing bots causes their
  associated Web Workers to `terminate()`.
  
* `run` Runs a Futuron battle, pitting the bot AIs against one another.

  Last man standing wins.
  
* `halt` Can be used to halt a battle, for example when only one bot remains.

* `help` Display the command line help

Developing your bot
-------------------
