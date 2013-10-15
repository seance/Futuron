var name = "Drunk Bot"

var strategy = function(look, state) {
	var pos = state.pos,
	    forward = state.dir ? state.dir : [1, 0],
	    left = turnLeft(forward),
	    right = turnRight(forward)
	    
	var lookDir = function(dir) {
		return look(move(pos, dir))
	}
	
	var dirs = []
	!lookDir(forward) && dirs.push(forward)
	!lookDir(left) && dirs.push(left)
	!lookDir(right) && dirs.push(right)
	    
	var dir = dirs.length ? dirs[Math.floor(Math.random() * dirs.length)] : forward

	return {
		pos: move(pos, dir),
		dir: dir
	}
}
