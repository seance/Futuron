var name = 'Drunk'

function strategy(look, state) {
  var pos = state.pos,
      fwd = state.dir || [1, 0],
      dirs = [fwd, turnLeft(fwd), turnRight(fwd)],
      dir = dirs[Math.floor(Math.random() * dirs.length)]
  
  return {
    pos: move(pos, dir),
    dir: dir
  }
}