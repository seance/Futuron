;(function() {
	var look = function(arena, pos) {
		if (pos[0] < 0 || pos[0] >= 60)
			return true
			
		if (pos[1] < 0 || pos[1] >= 60)
			return true
	
		for (var i = 0; i < arena.length; i++) {
			if (arena[i][0] === pos[0] && arena[i][1] === pos[1])
				return true
		}
		
		return false
	}
	
	var move = function(pos, delta) {
		return [pos[0] + delta[0], pos[1] + delta[1]]
	}

	onmessage = function(m) {
		switch (m.data.cmd) {
			case 'name':
				postMessage({ cmd: 'name', args: 'Blue Steel'})
				break
			case 'move':
				var arena = m.data.args.arena,
					state = m.data.args.state,
				    pos = state.pos,
					dx  = typeof(state.dir) === 'undefined' ? 1 : state.dir[0],
					dy  = typeof(state.dir) === 'undefined' ? 0 : state.dir[1]
				
				var forward = [dx, dy],
			        left = [dy, -dx],
					right = [-dy, dx]
					
				var pForward = move(pos, forward),
				    pLeft = move(pos, left),
					pRight = move(pos, right)
				
				/*
				var dir = look(arena, pForward) ? null : pForward
				dir = look(arena, pLeft) ? dir : pLeft
				dir = look(arena, pRight) ? dir : pRight
				*/
				
				var dir = look(arena, pForward) ? left : forward
				var foo = look(arena, pForward) ? 'left' : 'forward'
				
				postMessage({ cmd: 'move', args: {
					pos: move(pos, dir), dir: dir, foo: foo
				}})
				
				break
			default:
		}
	}		
})()