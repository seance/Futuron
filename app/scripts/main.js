$(function() { (function(opts) {

var Signal = {
	create: function() {
		var idGen = 0,
			persistents = [],
			transients = []
			
		return {
			add: function(f) {
				var id = idGen++
				persistents.push({id: id, fun: f})
				return id
			},
			addOnce: function(f) {
				var id = idGen++
				transients.push({id: id, fun: f})
				return id
			},
			remove: function(id) {
				persistents = _.reject(persistents, function(p) {
					return p.id === id
				})
			},
			removeOnce: function(id) {
				transients = _.reject(transients, function(t) {
					return t.id === id
				})
			},
			emit: function(data) {
				_.each(persistents, function(p) { p.fun(data) })
				_.each(transients, function(t) { t.fun(data) })
				transients = []
			}
		}
	}
}

var Loader = (function() {
	var wrapWorkerTemplate = function(w) {
		return _.template($('#worker-template').html(), { body: w })
	}
	
	function loadUrl(url, success, error) {
		$.ajax({
			url: url,
			dataType: 'text',
			error: error,
			success: function(data) {
				success(new Worker(URL.createObjectURL(new Blob([
					wrapWorkerTemplate(data)
				]))))
			}
		})
	}
	
	function loadRemote(ip, success, error) {
		loadUrl('http://' + ip + ':8000/scripts/bot.js', success, error)
	}
	
	function loadLocal(name, success, error) {
		loadUrl('scripts/' + name + '.js', success, error)
	}

	return {
		load: function(spec, success, error) {
			loadLocal(spec, success, function() {
				loadRemote(spec, success, function() {
					loadUrl(spec, success, error)
				})
			})
		}
	}
})()

var Handler = (function() {
	function sanitize(name) {
		return escape(name).replace(/%20/g, ' ')
	}

	return {
		create: function(worker, ready) {
			var name = Signal.create(),
			    moves = Signal.create(),
			    recvs = Signal.create(),
			    messageId = 0
			
			worker.onmessage = function(m) {
				switch (m.data.cmd) {
					case 'name': name.emit(m.data.args); break
					case 'move': moves.emit(m.data.args); break
					case 'recv': recvs.emit(m.data.args); break
					default:
						console.log('Unexpected message from bot ' + bot.id + ':', m)
				}
			}
			
			name.addOnce(function(name) {
				ready({
					name: name,
					moves: moves,
					requestMove: function(arena, state, received) {
						var echo = messageId++,
							listener = recvs.add(function(receipt) {
							if (receipt === echo) {
								recvs.remove(listener)
								received(echo)
							}
						})
						
						worker.postMessage({
							cmd: 'move',
							args: {
								arena: arena,
								state: state,
								echo: echo
							}
						})
					}
				})
			})
			
			worker.postMessage({
				cmd: 'name',
				args: {
					url: document.location.href,
					size: opts.gridSize
				}
			})
		}
	}	
})()

var Grid = (function() {
	
	var _square = '<div class="grid-square" data-x="<%=x%>" data-y="<%=y%>"></div>',
	
	    _legendBoxCss = 'background-color: hsl(<%=hue%>, 100%, 50%);'+
	                    'box-shadow: 0 0 15px hsl(<%=hue%>, 100%, 50%);',
	              
	    _legend = '<div class="legend-bot clearfix" data-id="<%=id%>">'+
	              	'<div class="legend-hue" style="<%=style%>"></div>'+
	              	'<div class="legend-name">[<%=id%>] <%=name%></div>'+
	              '</div>'
	              
	function x(index) {
		return index % opts.gridSize
	}
	
	function y(index) {
		return Math.floor(index / opts.gridSize)
	}
	
	function $square(x, y) {
		return $(_.template('.grid-square[data-x="<%=x%>"][data-y="<%=y%>"]', {x: x, y: y}))
	}
	
	function $legend(id) {
		return $(_.template('.legend-bot[data-id="<%=id%>"]', {id: id}))
	}
	
	function squareCss(bot) {
		return {
			'background-color': bot ? 'hsl(' + bot.hue + ', 100%, 50%)' : '',
			'box-shadow':       bot ? '0 0 5px hsl(' + bot.hue + ', 100%, 50%)' : '',
			'position':			bot ? 'relative' : '',
			'z-index':			bot ? 3 : ''
		}
	}
	
	_.each(_.range(0, opts.gridSize * opts.gridSize), function(i) {
		opts.$grid.append($(_.template(_square, { x: x(i), y: y(i) })))
	})
	
	opts.$grid.css({
		width: opts.gridSize * opts.gridScale,
		height: opts.gridSize * opts.gridScale
	})
	
	$('.grid-square').css({
		width: opts.gridScale,
		height: opts.gridScale
	})

	return {
		insertBot: function(bot) {
			opts.$legend.append($(_.template(_legend, {
				id: bot.id,
				hue: bot.hue,
				name: bot.name,
				style: _.template(_legendBoxCss, { hue: bot.hue })
			})))
		},
		updateBotPosition: function(bot) {
			$square(bot.pos[0], bot.pos[1]).css(squareCss(bot))
		},
		updateBotIsDead: function(bot) {
			$legend(bot.id).addClass('dead')
			_.each(bot.trail, function(pos) {
				$square(pos[0], pos[1]).css(squareCss(null))
			})
		},
		updateBotIsAlive: function(bot) {
			$legend(bot.id).removeClass('dead')
		},
		removeBot: function(bot) {
			$legend(bot.id).remove()
			_.each(bot.trail, function(pos) {
				$square(pos[0], pos[1]).css(squareCss(null))
			})
		},
		resetGrid: function() {
			$('.legend-bot').removeClass('dead')
			$('.grid-square').css(squareCss(null))
		}
	}	
})()

var Game = (function() {
	var halt, tick, arena = [], bots = [], idGen = 0, hueGen = -35
	
	function randomInSize() {
		return Math.floor(Math.random() * opts.gridSize)
	}
	
	function aliveBots() {
		return _.filter(bots, function(bot) {
			return bot.alive
		})
	}
	
	function updateBotState(bot, state) {
		_.extend(bot.state, state)
	}
	
	function updateBotPosition(bot) {
		bot.pos = bot.state.pos
		bot.trail.push(bot.pos)
		arena.push(bot.pos)
		
		Grid.updateBotPosition(bot)
	}
	
	function updateBotIsDead(bot) {
		bot.alive = false
	}
	
	function removeBotTrails(dead) {
		_.each(dead, function(bot) {
			arena = _.difference(arena, bot.trail)
			Grid.updateBotIsDead(bot)
		})
	}
	
	function requestBotMoves(done) {
		var receipts = bots.length
		_.each(bots, function(bot) {
			bot.handler.requestMove(arena, bot.state, function() {
				(--receipts === 0) && done()
			})
		})
	}
	
	function requestMovesAndScheduleTick() {
		requestBotMoves(function() {
			tick = setTimeout(function() {
				if (processTick()) {
					requestMovesAndScheduleTick()
				}
			}, opts.tickDelay)
		})
	}
	
	function checkBotMove(bot) {
		function reportFail(check, message) {
			!check && Term.echo('Bot ' + bot.id + ', ' + bot.name + ', crashed: ' + message)
			return check
		}
		function movedInTime(pos, move) {
			return reportFail(move && (pos[0] !== move[0] || pos[1] !== move[1]), 'timeout')
		}
		function withinBounds(c) {
			return reportFail(c >= 0 && c < opts.gridSize, 'out of bounds')
		}
		function legalTransition(pos, move) {
			function diffByOne(a, b) { return a === b - 1 || a === b + 1 }
			return reportFail(
				(pos[0] === move[0] && diffByOne(pos[1], move[1])) ||
				(pos[1] === move[1] && diffByOne(pos[0], move[0])), 'illegal move')
		}
		function notCollision(move) {
			return reportFail(!_.some(arena, function(wall) {
				return wall[0] === move[0] && wall[1] === move[1]
			}), 'collision')
		}
		
		var pos = bot.pos, move = bot.state.pos
		
		return movedInTime(pos, move) &&
		       withinBounds(move[0]) &&
		       withinBounds(move[1]) &&
		       legalTransition(pos, move) &&
		       notCollision(move)
	}
	
	function processTick() {
		var killedBots = []
	
		_.each(aliveBots(), function(bot) {
			if (checkBotMove(bot)) {
				updateBotPosition(bot)
			} else {
				updateBotIsDead(bot)
				killedBots.push(bot)
			}
		})
		
		removeBotTrails(killedBots)
		
		return aliveBots().length && !halt
	}
	
	function resetArenaAndBots() {
		arena = []
		
		_.each(bots, function(bot) {
			bot.alive = true
			bot.trail = []
			bot.pos = [randomInSize(), randomInSize()]
			bot.state = { pos: bot.pos }
			
			Grid.updateBotIsAlive(bot)
			Grid.updateBotPosition(bot)
		})
		
		Grid.resetGrid()
	}
	
	return {
		createBot: function(handler, ready) {
			var bot = {
				id: idGen++,
				name: handler.name,
				alive: true,
				hue: (hueGen += 35) % 255,
				pos: [randomInSize(), randomInSize()],
				state: {},
				handler: handler
			}
			
			bot.state.pos = bot.pos
			
			handler.moves.add(function(state) {
				updateBotState(bot, state)
			})
			
			bots.push(bot)
			ready(bot)
		},
		removeBot: function(id, removed, notFound) {
			var bot = _.findWhere(bots, {id: id})
			
			if (bot) {
				bots = _.without(bots, bot)
				removed(bot)
			}
			else notFound(id)
		},
		run: function() {
			halt = false
			resetArenaAndBots()
			requestMovesAndScheduleTick()
		},
		halt: function() {
			halt = true
			clearTimeout(tick)
		}
	}	
})()

var Term = (function() {

	function printHelp(term) {
		term.echo('F U T U R O N - 5 1 1 Operating System\n\n' +
			'help                       This help (helpful, huh?)\n' +
			'rez <spec1> [<specN>...]   Rez bots; spec is filename (w/o ext), IP address or URL\n' +
			'derez <id1> [<idN>...]     Derez bots; IDs must match given bot IDs\n' +
			'run                        Start the Futuron battle\n' +
			'halt                       Halt a battle in progress\n')
	}
	
	function parseCommand(command, term) {
		var a;
		switch (true) {
			case !!(a = /^rez (.+)$/i.exec(command)):
				Futuron.rez(parseArgs(a[1]))
				break
			case !!(a = /^derez (.+)$/i.exec(command)):
				Futuron.derez(parseArgs(a[1]))
				break
			case !!(a = /^run$/i.exec(command)):
				Futuron.run()
				break
			case !!(a = /^halt$/i.exec(command)):
				Futuron.halt()
				break
			case !!(a = /^help$/i.exec(command)):
				printHelp(term)
				break
			default:
				command && term.echo('Try `help`')
		}
	}
	
	function parseArgs(s) {
		return s.replace(/,/g, ' ').replace(/[ ]+/g, ' ').split(' ')
	}
	
	var term = opts.$terminal.terminal(parseCommand, {
		greetings: 'F U T U R O N - 5 1 1\n'+
		           'MCP Ready\n',
		prompt: '$ ',
		height: opts.termHeight
	})
	
	return {
		echo: function(m) { term.echo(m) },
		error: function(m) { term.error(m) }
	}
})()

var Futuron = (function() {
	function format(s) {
		return String(s).replace(/,/g, ', ')
	}
	
	return {
		rez: function(specs) {
			Term.echo('Rezzing ' + format(specs) + '...')
			_.each(specs, function(spec) {
				Loader.load(spec, function(worker) {
					Handler.create(worker, function(handler) {
						Game.createBot(handler, function(bot) {
							Grid.insertBot(bot)
							Term.echo('Rezzed bot ' + bot.id + ', ' + bot.name)
						})
					})
				}, function(error) {
					Term.error('Error rezzing ' + spec)
				})
			})
		},
		derez: function(ids) {
			_.each(ids, function(id) {
				Game.removeBot(parseInt(id), function(bot) {
					Grid.removeBot(bot)
					Term.echo('Derezzed bot ' + bot.id + ', ' + bot.name)
				}, function() {
					Term.error('No such bot ' + id)
				})
			})
		},
		run: function() {
			Term.echo('Running Futuron battle!')
			Game.run()
		},
		halt: function() {
			Term.echo('Halt')
			Game.halt()
		}
	}
})()

})({
	gridSize:	60,
	gridScale:	8,
	termHeight: 200,
	tickDelay:	100,
	$grid:		$('.grid'),
	$legend:	$('.legend'),
	$terminal:	$('.terminal')
})})
