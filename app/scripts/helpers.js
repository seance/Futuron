define(['lodash', 'options'], function(_, options) {
  
  _.mixin({
    indexOf: _.wrap(_.indexOf, function(fn, array, value, fromIndex) {
      return !_.isObject(value)
        ? fn(array, value, fromIndex)
        : _.findIndex(fromIndex ? array.slice(fromIndex) : array, function(other) {
          return Array.isArray(value) && Array.isArray(other)
            ? value[0] === other[0] && value[1] === other[1]
            : _.isEqual(value, other)
        })
    })
  })
  
  function time() {
    return new Date().getTime()
  }
  
  function mkLook(trails) {
    var look = function(pos) {
      look.looks++
      
      function withinBounds(c) {
        return c >= 0 && c < options.gridSize
      }
      
      return !_.all(pos, withinBounds) ||
        _.contains(trails[pos[0]], pos[1])
    }
    
    look.looks = 0
    return look
  }
  
  function turnLeft(dir) {
    return [dir[1], -dir[0]]
  }
  
  function turnRight(dir) {
    return [-dir[1], dir[0]]
  }
  
  function move(pos, dir) {
    return [pos[0] + dir[0], pos[1] + dir[1]]
  }
  
  var directions = [[1, 0], [0, 1], [-1, 0], [0, -1]]
  
  return {
    time: time,
    mkLook: mkLook,
    move: move,
    turnLeft: turnLeft,
    turnRight: turnRight,
    directions: directions
  }
})