define([
  'jquery',
  'lodash',
  'text!templates/worker.js'
],
function($, _, template) {
  
  function wrapWorkerTemplate(botText) {
    return _.template(template, { botText: botText })
  }
  
  function createWorker(botText) {
    return new Worker(URL.createObjectURL(new Blob([
      wrapWorkerTemplate(botText)
    ])))
  }
  
  function loadUrl(url, success, error) {
    $.ajax({
      url: url,
      dataType: 'text',
      error: error,
      success: function(data) {
        success(createWorker(data))
      }
    })
  }
  
  function loadRemote(host, success, error) {
    loadUrl('http://' + host + ':9000/scripts/bots/bot.js', success, error)
  }
  
  function loadLocal(name, success, error) {
    loadUrl('scripts/bots/' + name + '.js', success, error)
  }
  
  function loadBot(spec, success, error) {
    loadLocal(spec, success, function() {
      loadRemote(spec, success, function() {
        loadUrl(spec, success, error)
      })
    })
  }
  
  return {
    load: loadBot
  }
})