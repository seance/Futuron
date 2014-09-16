define([
  'require',
  'jquery',
  'options',
  'jquery.terminal'
],
function(require, $, options) {
  
  var term
  
  function init() {
    term = $('#term').terminal(parseCommand, {
      greetings: 'F U T U R O N - 5 1 1\nMCP Ready\n',
      prompt: '$ ',
      height: options.termHeight
    })
  }
  
  function printHelp(term) {
    term.echo(
      'F U T U R O N - 5 1 1 Operating System\n\n' +
      'help                       This help (helpful, huh?)\n' +
      'rez <spec1> [<specN>...]   Rez bots; spec is filename (w/o ext), IP address or URL\n' +
      'derez <id1> [<idN>...]     Derez bots; IDs must match given bot IDs\n' +
      'run                        Start the Futuron battle\n' +
      'halt                       Halt a battle in progress\n')
	}
  
  function parseArgs(s) {
    return s.replace(/,/g, ' ').replace(/[ ]+/g, ' ').split(' ')
  }
  
  function parseCommand(command, term, a) {
    var futuron = require('futuron')
    
    switch (true) {
        case Boolean(a = /^rez (.+)$/i.exec(command)):
          futuron.rez(parseArgs(a[1]))
          break
        case Boolean(a = /^derez (.+)$/i.exec(command)):
          futuron.derez(parseArgs(a[1]))
          break
        case Boolean(a = /^run$/i.exec(command)):
          futuron.run()
          break
        case Boolean(a = /^halt$/i.exec(command)):
          futuron.halt()
          break
        case Boolean(a = /^help$/i.exec(command)):
          printHelp(term)
          break
        default:
          command && term.echo('Try `help`')
    }
  }
  
  function notifyBotIsDead(bot, reason) {
    term.echo('Bot ' + bot.id + ', ' + bot.name + ', crashed: ' + reason)
  }
  
  function notifyRezzedBot(bot) {
    term.echo('Rezzed bot ' + bot.id + ', ' + bot.name)
  }
  
  function notifyDerezzedBot(bot) {
    term.echo('Derezzed bot ' + bot.id + ', ' + bot.name)
  }
  
  function notifyBotNotFound(id) {
    term.echo('No such bot id: ' + id)
  }
  
  function notifyErrorLoadingBot(spec) {
    term.echo('Error loading: ' + spec)
  }
  
  return {
    init: init,
    notifyBotIsDead: notifyBotIsDead,
    notifyRezzedBot: notifyRezzedBot,
    notifyDerezzedBot: notifyDerezzedBot,
    notifyBotNotFound: notifyBotNotFound,
    notifyErrorLoadingBot: notifyErrorLoadingBot
  }
})