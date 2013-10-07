;(function() {
	onmessage = function(m) {
		switch (m.data.cmd) {
			case 'name':
				postMessage({ cmd: 'name', args: 'Buzz Lightyear'})
				break
			case 'move':
				var pos = m.data.args.state.pos
				postMessage({ cmd: 'move', args: {
					pos: [pos[0] + 1, pos[1]]
				}})
				break
			default:
		}
	}		
})()