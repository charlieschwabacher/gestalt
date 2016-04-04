var cliclopts = require('./')

var options = [
  {
    name: 'verbose',
    abbr: 'v',
    alias: ['loud'],
    boolean: true,
    help: 'be verbose'
  },
  {
    name: 'path',
    abbr: 'p',
    default: 'dat.json',
    help: 'path to file'
  }
]

var clopts = cliclopts(options)

clopts.print()
