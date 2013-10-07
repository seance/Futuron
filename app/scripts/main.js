;(function($) {

var Loader = {
	loadWorkerUrl: function(url, success, error) {
		$.ajax({
			url: url,
			dataType: 'text',
			error: error,
			success: function(data) {
				success(new Worker(URL.createObjectURL(new Blob([data]))))
			}
		})
	},
	loadWorkerRemote: function(ip, success, error) {
		Loader.loadWorkerUrl('http://' + ip + ':9000/scripts/bot.js', success, error)
	},
	loadWorkerLocal: function(name, success, error) {
		Loader.loadWorkerUrl('scripts/' + name + '.js', success, error)
	},
	loadWorker: function(spec, success, error) {
		Loader.loadWorkerLocal(spec, success, function() {
			Loader.loadWorkerRemote(spec, success, function() {
				Loader.loadWorkerUrl(spec, success, error)
			})
		})
	}
}

var Term = (function() {
	var TERM, parseArgs = function(s) {
		return s.replace(/,/g, ' ').replace(/[ ]+/g, ' ').split(' ')
	}
	
	return {
		init: function(target) {
			TERM = $(target).terminal(function(command, term) {
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
						term.echo('F U T U R O N - 5 1 1  Operating System\n\n' +
							'help                       This help (helpful, huh?)\n' +
							'rez <spec1> [<specN>...]   Rez bots; spec is filename (w/o ext), IP address or URL\n' +
							'derez <id1> [<idN>...]     Derez bots; IDs must match given bot IDs\n' +
							'run                        Start the Futuron battle\n' +
							'halt                       Halt a battle in progress\n')
						break
					default:
						command && term.echo('Try `help`')
				}
			}, {
				greetings: 'F U T U R O N - 5 1 1\nMCP loaded.\n',
				prompt: '$ ',
				height: 200
			})
		},
		echo: function(m) {
			TERM.echo(m)
		},
		error: function(m) {
			TERM.error(m)
		}
	}
})()

var Grid = (function() {
	var SIZE = 0, $grid, $legend
	
	return {
		init: function(target, legend, size) {
			SIZE = size
			$grid = $(target)
			$legend = $(legend)
			Grid.buildGrid()
		},
		buildGrid: function() {
			_.each(_.range(0, SIZE*SIZE), function(i) {
				$grid.append($('<div class="grid-square" data-x="'+Grid.x(i)+'" data-y="'+Grid.y(i)+'"></div>'))
			})
		},
		x: function(i) {
			return i % SIZE
		},
		y: function(i) {
			return Math.floor(i / SIZE)
		},
		addBotLegend: function(bot) {
			var style = 'background-color: hsl('+bot.hue+', 100%, 50%);'+
			            'box-shadow: 0 0 15px hsl('+bot.hue+', 100%, 50%);'
			            
			$legend.append($(
				'<div class="legend-bot clearfix" data-id="'+bot.id+'">'+
					'<div class="legend-hue" style="'+style+'"></div>'+
					'<div class="legend-name">['+bot.id+'] '+bot.name+'</div>'+
				'</div>'))
		},
		removeBotLegend: function(bot) {
			$('.legend-bot[data-id="'+bot.id+'"]').remove()
		},
		markBotDeadInLegend: function(bot) {
			$('.legend-bot[data-id="'+bot.id+'"]').addClass('dead')
		},
		updateBotPosition: function(bot) {
			var x = bot.pos[0], y = bot.pos[1]
			
			$('.grid-square[data-x="'+x+'"][data-y="'+y+'"]').css({
				'background-color': 'hsl('+bot.hue+', 100%, 50%)',
				'box-shadow': '0 0 5px hsl('+bot.hue+', 100%, 50%)',
				'position': 'relative',
				'z-index': 3
			}).removeClass('pulse')
		},
		removeBotTrail: function(bot) {
			_.each(bot.trail, function(pos, index) {
				var x = pos[0], y = pos[1]
				setTimeout(function() {
					$('.grid-square[data-x="'+x+'"][data-y="'+y+'"]').css({
						'background-color': '',
						'box-shadow': '',
						'position': '',
						'z-index': ''
					})
				}, 0)
			})
		},
		resetGrid: function() {
			$('.legend-bot').removeClass('dead')
			$('.grid-square').css({
				'background-color': '',
				'box-shadow': '',
				'position': '',
				'z-index': ''
			})
		},
		pulseSquare: function(x, y) {
			$('.grid-square[data-x="'+x+'"][data-y="'+y+'"]').addClass('pulse')
			setTimeout(function() {
				$('.grid-square[data-x="'+x+'"][data-y="'+y+'"]').removeClass('pulse')
			}, 5000)
		}
	}
})()

var Handler = (function() {
	var sanitize = function(name) {
		return escape(name).replace(/%20/g, ' ')
	}

	return {
		createHandler: function(bot, worker, complete) {
			worker.onmessage = function(m) {
				switch (m.data.cmd) {
					case 'name':
						complete($.extend(bot, { name: sanitize(m.data.args) }))
						break
					case 'move':
						$.extend(bot.state, m.data.args)
						break
					default:
						console.log('Unexpected message from bot ' + bot.id, m)
				}	
			}

			worker.postMessage({ cmd: 'name' })
		}
	}
})()

window.Futuron = (function() {
	var SIZE, tick, arena = [], bots = [], idGen = 0, hueGen = -35
	
	var randomInt = function() {
		return Math.floor(Math.random() * SIZE)
	}
	
	var createBot = function(worker, complete) {
		var bot = {
			id: idGen++,
			hue: hueGen = (hueGen + 35) % 255,
			alive: true,
			trail: [],
			pos: [randomInt(), randomInt()],			
			worker: worker
		}
		
		bot.state = { pos: [bot.pos[0], bot.pos[1]] }
		
		Handler.createHandler(bot, worker, function(bot) {
			bots.push(bot)
			complete(bot)
		})
	}
	
	var removeBot = function(id, removed, notFound) {
		var bot = _.findWhere(bots, {id: id})
		
		if (bot) {
			bots = _.without(bots, bot);
			removed(bot)
		}
		else notFound()
	}
	
	var resetArenaAndBots = function() {
		Grid.resetGrid()
		arena = []
		_.each(bots, function(bot) {
			bot.alive = true
			bot.pos = [randomInt(), randomInt()]
			bot.trail = [bot.pos]
			bot.state = {
				pos: [bot.pos[0], bot.pos[1]]
			}
			Grid.updateBotPosition(bot)
			arena.push(bot.pos)
		})
	}
	
	var requestBotMoves = function() {
		_.each(bots, function(bot) {
			bot.alive && bot.worker.postMessage({ cmd: 'move', args: {
				arena: arena,
				state: bot.state
			}})
		})
	}
	
	var isLegalMove = function(bot) {
		var withinBounds = function(c) {
			return c >= 0 && c < SIZE
		}
		var differsByOne = function(a, b) {
			return a === b - 1 || a === b + 1
		}
		var legalTransition = function(moveX, moveY, posX, posY) {
			return (moveX === posX && differsByOne(moveY, posY)) ||
			       (moveY === posY && differsByOne(moveX, posX))
		}
		var notCollision = function(move) {
			return !_.some(arena, function(obstacle) {
				return obstacle[0] === move[0] && obstacle[1] === move[1]
			})
		}
		
		var move = bot.state.pos, pos = bot.pos
	
		return move &&
			   withinBounds(move[0]) &&
			   withinBounds(move[1]) &&
			   legalTransition(move[0], move[1], pos[0], pos[1]) &&
			   notCollision(move)
	}
	
	var processTick = function(Term, Grid) {
		var aliveBots = 0
		_.each(bots, function(bot) {
			if (bot.alive) {
				if (isLegalMove(bot)) {
					aliveBots++
					bot.pos = bot.state.pos
					bot.trail.push(bot.pos)
					arena.push(bot.pos)
					Grid.updateBotPosition(bot)
				} else {
					bot.alive = false
					arena = _.difference(arena, bot.trail)
					Grid.removeBotTrail(bot)
					Grid.markBotDeadInLegend(bot)
					Term.echo('Bot ' + bot.id + ', ' + bot.name + ', crashed!')
				}
			}
		})
		
		if (aliveBots <= 0) clearInterval(tick)
	}
	
	var initGridPulse = function() {
		setInterval(function() {
			var x = randomInt(), y = randomInt()
			if (!_.some(arena, function(wall) {
				return wall[0] === x && wall[1] === y
			})) {
				Grid.pulseSquare(x, y)
			}
		}, 100)
	}
	
	return {
		init: function(size, term, grid, legend) {
			SIZE = size
			initGridPulse()
			Term.init(term)
			Grid.init(grid, legend, size)
		},
		
		rez: function(specs) {
			Term.echo('Rezzing ' + specs + '...')
			_.each(specs, function(spec) {
				Loader.loadWorker(spec, function(worker) {
					createBot(worker, function(bot) {
						Grid.addBotLegend(bot)
						Term.echo('Rezzed bot ' + bot.id + ', ' + bot.name)
					})
				}, function(e) {
					Term.error('Error rezzing ' + spec)
				})
			})
		},
		
		derez: function(ids) {
			_.each(ids, function(id) {
				removeBot(parseInt(id), function(bot) {
					bot.worker.terminate()
					Grid.removeBotTrail(bot)
					Grid.removeBotLegend(bot)
					Term.echo('Derezzed bot ' + id)
				}, function() {
					Term.error('No such bot ' + id)
				})
			})
		},
		
		run: function() {
			Term.echo('Running Futuron battle!')
			resetArenaAndBots()
			requestBotMoves()
			clearInterval(tick)
			tick = setInterval(function() {
				processTick(Term, Grid)
				requestBotMoves()
			}, 100)
		},
		
		halt: function() {
			Term.echo('Halt')
			clearInterval(tick)
		}
	}
})()

Futuron.init(60, '.terminal', '.grid', '.legend')

})(jQuery)