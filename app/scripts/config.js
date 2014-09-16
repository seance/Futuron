define([], function() {
  require.config({
    paths: {
      'text':             '../../bower_components/text/text',
      'jquery':           '../../bower_components/jquery/dist/jquery',
      'jquery.terminal':  '../../bower_components/jquery.terminal/js/jquery.terminal-0.8.8',
      'modernizr':        '../../bower_components/modernizr/modernizr',
      'lodash':           '../../bower_components/lodash/dist/lodash',
      'signals':          '../../bower_components/signals/dist/signals'
    },
    shim: {
      'jquery':           { exports: 'jQuery' },
      'jquery.terminal':  { deps: ['jquery'] },
      'modernizr':        { exports: 'Modernizr' },
      'signals':          { exports: 'signals.Signal' }
    }
  })
})