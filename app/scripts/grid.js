define([
  'jquery',
  'lodash',
  'options',
  'text!templates/gridSquare.html',
  'text!templates/legendBot.html',
  'text!templates/botColor.css',
  'text!templates/dummyColor.css',
  'text!templates/legendColor.css',
  'text!templates/colorClass.css',
  'text!templates/squareSelect.css',
  'text!templates/legendSelect.css'
],
function($, _, options,  _gridSquare, _legendBot, _botColor, _dummyColor,
          _legendColor, _colorClass, _squareSelect, _legendSelect)
{
  var $grid = $('#grid'),
      $legend = $('#legend'),
      $gridSquare,
      gridStyles,
      legendStyles
  
  function $_template(template, args) {
    return $(_.template(template.replace(/\n/g, ''), args))
  }
  
  function $square(x, y) {
    return $_template(_squareSelect, { x: x, y: y })
  }
  
  function $legendItem(id) {
    return $_template(_legendSelect, { id: id })
  }
  
  function $colorClass(id) {
    return _.template(_colorClass, { id: id })
  }
  
  function x(index) {
    return index % options.gridSize
  }
  
  function y(index) {
    return Math.floor(index / options.gridSize)
  }
  
  function generateStyles() {
    gridStyles = $('<style/>').appendTo($('head'))[0].sheet
    legendStyles = $('<style/>').appendTo($('head'))[0].sheet
  }
  
  function generateGrid() {
     _.forEach(_.range(Math.pow(options.gridSize, 2)), function(i) {
       $grid.append($_template(_gridSquare, { x: x(i), y: y(i) }))
    })
    $gridSquare = $('.grid-square')
  }
  
  function resizeGrid() {
    var size = options.gridSize,
        scale = options.gridScale
    
    $grid.css({ width: size*scale, height: size*scale })
    $gridSquare.css({ width: scale, height: scale })
  }
  
  function init() {
    generateStyles()
    generateGrid()
    resizeGrid()
  }
  
  function insertLegendColorCss(bot) {
    legendStyles.insertRule(_.template(_legendColor, { id: bot.id, hue: bot.hue }), bot.id)
  }
  
  function insertBotColorCss(bot) {
    gridStyles.deleteRule(bot.id)
    gridStyles.insertRule(_.template(_botColor, { id: bot.id, hue: bot.hue }), bot.id)
  }
  
  function removeBotColorCss(bot) {
    gridStyles.deleteRule(bot.id)
    insertDummyColorCss(bot)
  }
  
  function insertDummyColorCss(bot) {
    gridStyles.insertRule(_.template(_dummyColor, { id: bot.id }), bot.id)
  }
  
  function insertBot(bot) {
    $legend.append($_template(_legendBot, { id: bot.id, name: bot.name}))
    insertLegendColorCss(bot)
    insertDummyColorCss(bot)
  }
  
  function updateBotPosition(bot) {
    $square(bot.state.pos[0], bot.state.pos[1]).addClass($colorClass(bot.id))
  }
  
  function updateBotIsDead(bot) {
    $legendItem(bot.id).addClass('dead')
    removeBotColorCss(bot)
    clearBotInfo(bot)
  }
  
  function updateBotIsAlive(bot) {
    $legendItem(bot.id).removeClass('dead')
    insertBotColorCss(bot)
  }
  
  function updateBotInfo(bot, info) {
    var timeString = (info.time > 0 ? info.time : '<1') + ' ms'
    var looksString = info.looks + ' looks'
    $legendItem(bot.id).find('.legend-info').html(
      '(' + timeString + ', ' + looksString + ')')
  }
  
  function clearBotInfo(bot) {
    $legendItem(bot.id).find('.legend-info').empty()
  }
  
  function removeBot(bot) {
    updateBotIsDead(bot)
    removeBotColorCss(bot)
    $legendItem(bot.id).remove()
  }
  
  function resetGrid() {
    $('.legend-bot').removeClass('dead')
    $gridSquare.removeClass().addClass('grid-square')
  }
  
  return {
    init: init,
    insertBot: insertBot,
    updateBotPosition: updateBotPosition,
    updateBotIsDead: updateBotIsDead,
    updateBotIsAlive: updateBotIsAlive,
    updateBotInfo: updateBotInfo,
    removeBot: removeBot,
    reset: resetGrid
  }
})