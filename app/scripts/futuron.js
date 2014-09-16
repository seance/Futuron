define([
  'lodash',
  'loader',
  'handler',
  'grid',
  'game',
  'term'
],
function(_, loader, handler, grid, game, term) {
  
  function init() {
    grid.init()
    term.init()
  }
  
  function rez(specs) {
    _.forEach(specs, function(spec) {
      game.createBot(spec)
    })
  }
  
  function derez(ids) {
    _.forEach(ids, function(id) {
      game.removeBot(id)
    })
  }
  
  function run() {
    game.run()
  }
  
  function halt() {
    game.halt()
  }
  
  return {
    init: init,
    rez: rez,
    derez: derez,
    run: run,
    halt: halt
  }
})