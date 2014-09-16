(function() {
 require(['config'], function() {
   require(['futuron', 'helpers'], function(futuron, helpers) {
     futuron.init()
     
     window.Futuron = futuron
     window.look = helpers.mkLook([])
     window.move = helpers.move
     window.turnLeft = helpers.turnLeft
     window.turnRight = helpers.turnRight
     window.directions = helpers.directions
   })
 })
})()