var root = decodeURIComponent(location.href.slice(5) + '/../scripts/')

importScripts(root + '../bower_components/requirejs/require.js')

require([root + '/config.js'], function() {
  require({ baseUrl: root }, ['lodash', 'helpers'], function(_, helpers) {
    
    var move = helpers.move,
        turnLeft = helpers.turnLeft,
        turnRight = helpers.turnRight,
        directions = helpers.directions

    var W = (function() {
  
      <%= botText %>

      return {
        name: name,
        strategy: strategy
      }
    })()

    onmessage = function(m) {
      switch (m.data.cmd) {
        case 'name':
          postMessage({ cmd: 'name', args: { name: W.name }})
          break
        case 'move':
          var look = helpers.mkLook(m.data.args.trails),
              state = m.data.args.state,
              start = helpers.time()
          
          postMessage({ cmd: 'move', args: {
            state: W.strategy(look, state),
            info: {
              time: helpers.time() - start,
              looks: look.looks
            }
          }})
          break
        default:
          console.log('Unknown message', m)
      }
    }
    
    postMessage({ cmd: 'init', args: {}})
  })
})
