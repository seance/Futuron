var name = "Blue Steel"

var move = function(pos, delta) {
	return [pos[0] + delta[0], pos[1] + delta[1]]
}

var strategy = function(look, state) {
	var pos = state.pos,
	    forward = state.dir ? state.dir : [1, 0],
	    left = turnLeft(forward),
	    right = turnRight(forward)
	    
	var lookDir = function(dir) {
		return look(move(pos, dir))
	}
	    
	var dir = lookDir(forward)
		? lookDir(left)
			? lookDir(right)
				? forward // no hope :(
				: right
			: lookDir(right)
				? left
				: Math.random() > 0.5 // left or right?
					? left
					: right
		: forward

	return {
		pos: move(pos, dir),
		dir: dir
	}
}
