define([
  'lodash',
  'options',
  'loader',
  'handler',
  'grid',
  'term'
],
function(_, options, loader, handler, grid, term) {
  
  var idGen = 0,
      hueGen = -35,
      bots = [],
      tick
  
  function botWasKilled(bot, reason) {
    bot.alive = false
    grid.updateBotIsDead(bot)
    term.notifyBotIsDead(bot, reason)
  }
  
  function checkMoveCondition(satisfied, bot, reason) {
    if (!satisfied) botWasKilled(bot, reason)
    return satisfied
  }
  
  function checkBotMove(bot, state) {
    var botPos = bot.state.pos,
        newPos = state.pos
    
    function hasNewPosition() {
      return newPos
    }
    
    function withinBounds() {
      return _.all(newPos, function(c) {
        return c >= 0 && c < options.gridSize
      })
    }
    
    function legalTransition() {
      return (Math.abs(botPos[0] - newPos[0]) === 1 && botPos[1] === newPos[1]) ||
             (Math.abs(botPos[1] - newPos[1]) === 1 && botPos[0] === newPos[0])
    }
    
    return checkMoveCondition(hasNewPosition(),  bot, 'no move') &&
          checkMoveCondition(withinBounds(),     bot, 'out of bounds') &&
          checkMoveCondition(legalTransition(),  bot, 'illegal move')
  }
  
  function checkCollision(move, others, trails) {
    var newPos = move.state.pos
    
    function headOnCollision() {
      return _.find(others, function(another) {
        return _.isEqual(another.state.pos, move.state.pos)
      })
    }
    
    function trailCollision() {
      return _.contains(trails[newPos[0]], newPos[1])
    }
        
    return checkMoveCondition(!headOnCollision(), move.bot, 'head-on-collision') &&
          checkMoveCondition(!trailCollision(),   move.bot, 'trail collision')
  }
  
  function processTick(moves, trails) {
    var timely = _.groupBy(moves, 'moved'),
        legals = [],
        finals = []

    // Timed out bots, mark dead & notify
    _.forEach(timely[false], function(move) {
      botWasKilled(move.bot, 'timeout')
    })
    
    // Check each bot's move in isolation
    _.forEach(timely[true], function(move) {
      if (checkBotMove(move.bot, move.state)) {
        legals.push(move)
      }
    })
    
    // Check for collisions
    _.forEach(legals, function(move) {
      if (checkCollision(move, _.without(legals, move), trails)) {
        finals.push(move)
      }
    })
    
    // Update game state for final moves
    _.forEach(finals, function(move) {
      move.bot.state = move.state
      move.bot.trail.push(move.state.pos)
      grid.updateBotPosition(move.bot)
      grid.updateBotInfo(move.bot, move.info)
    })
    
    return finals.length
  }
  
  function requestMoves(bots, trails) {
    return _.map(bots, function(bot) {
      var move = { bot: bot, state: {}, moved: false }
      
      bot.moves.addOnce(function(args) {
        move.state = args.state || {}
        move.info = args.info
        move.moved = true
      })
      
      bot.requestMove(trails, bot.state)
      
      return move
    })
  }
  
  function mergeTrails(bots) {
    return _.reduce(bots, function(trails, bot) {
      _.forEach(bot.trail, function(pos) {
        var ys = trails[pos[0]] || []
        ys.push(pos[1])
        trails[pos[0]] = ys
      })
      
      return trails
    }, [])
  }
  
  function removeMoveListeners(bots) {
    _.forEach(bots, function(bot) {
      bot.moves.removeAll()
    })
  }
  
  function requestMovesAndScheduleTick() {
    var alive = _.filter(bots, 'alive'),
        trails = mergeTrails(alive),
        moves = requestMoves(alive, trails)
      
    tick = setTimeout(function() {
      removeMoveListeners(alive)
      if (processTick(moves, trails)) {
        requestMovesAndScheduleTick()
      }
    }, options.tickDelay)
  }
  
  function cancelScheduledTick() {
    if (tick) {
      clearTimeout(tick)
      tick = null
    }
  }
  
  function resetGridAndUpdatePositions() {
    grid.reset()
    
    function random() {
      return Math.floor(Math.random() * options.gridSize)
    }
    
    _.forEach(bots, function(bot) {
      bot.alive = true
      bot.state = { pos: [random(), random()] }
      bot.trail = [bot.state.pos]
      grid.updateBotIsAlive(bot)
      grid.updateBotPosition(bot)
    })
  }
  
  function createBot(spec) {
    function error() {
      term.notifyErrorLoadingBot(spec)
    }
    
    loader.load(spec, function(worker) {
      handler.create(worker, function(handler) {
        var bot = {
          id: idGen++,
          name: handler.name,
          moves: handler.moves,
          requestMove: handler.requestMove,
          terminate: handler.terminate,
          hue: (hueGen += 35) % 255,
          state: {},
          trail: [],
          alive: true
        }

        bots.push(bot)
        grid.insertBot(bot)
        term.notifyRezzedBot(bot)
        
      }, error)
    }, error)
  }
  
  function removeBot(id) {
    var bot = _.find(bots, { id: Number(id) })
    
    if (bot) {
      bot.terminate()
      bots = _.without(bots, bot)
      grid.removeBot(bot)
      term.notifyDerezzedBot(bot)
    } else {
      term.notifyBotNotFound(id)
    }
  }
  
  function run() {
    resetGridAndUpdatePositions()
    requestMovesAndScheduleTick()
  }
  
  function halt() {
    cancelScheduledTick()
  }
  
  window.run = run
  window.halt = halt
  
  return {
    createBot: createBot,
    removeBot: removeBot,
    run: run,
    halt: halt
  }
})