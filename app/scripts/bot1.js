var name = 'Buzz Lightyear'

var strategy = function(look, state) {
	var x = state.pos[0], y = state.pos[1]
	
	return {
		pos: [x + 1, y]
	}
}
