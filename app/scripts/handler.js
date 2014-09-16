define(['options', 'signals'], function(options, Signal) {
  
  function sanitize(name) {
    return escape(name).replace(/%20/g, ' ')
  }
  
  function createHandler(worker, success, error) {
    var initComplete = new Signal(),
        initTimeout = new Signal(),
        nameReceived  = new Signal(),
        nameTimeout = new Signal(),
        moves = new Signal()
    
    worker.onmessage = function(m) {
      switch (m.data.cmd) {
        case 'init': initComplete.dispatch(m.data.args); break
        case 'name': nameReceived.dispatch(m.data.args); break
        case 'move': moves.dispatch(m.data.args); break
        default: console.log('Unknown message from bot', m)
      }
    }
    
    function initWorker() {
      worker.postMessage('init')
    }
    
    function requestName() {
      worker.postMessage({
        cmd: 'name',
        args: {
          url: document.location.href,
          size: options.gridSize
        }
      })
    }
    
    function requestMove(trails, state) {
      worker.postMessage({
        cmd: 'move',
        args: {
          trails: trails,
          state: state
        }
      })
    }
    
    initComplete.addOnce(function() {
      initTimeout.removeAll()
      
      nameReceived.addOnce(function(args) {
        nameTimeout.removeAll()
        success({
          name: sanitize(args.name),
          moves: moves,
          requestMove: requestMove,
          terminate: worker.terminate.bind(worker)
        })
      })

      nameTimeout.addOnce(function() {
        nameReceived.removeAll()
        error('Timeout getting name for bot')
      })
      
      setTimeout(function() {
        nameTimeout.dispatch()
      }, 100)
      
      requestName()
    })
    
    initTimeout.addOnce(function() {
      initComplete.removeAll()
      error('Timeout initializing bot')
    })
    
    setTimeout(function() {
      initTimeout.dispatch()
    }, 1000)
    
    initWorker()
  }
  
  return {
    create: createHandler
  }
})