var minimist = require('minimist')
var cliclopts = require('cliclopts')
var xtend = require('xtend')
var debug = require('debug')('subcommand')

module.exports = function subcommand (config, options) {
  if (!options) options = {}
  if (Array.isArray(config)) {
    config = { commands: config }
  }
  if (!config.commands) config.commands = []
  if (!config.defaults) config.defaults = []
  // return value false means it was not handled
  // return value true means it was
  return function matcher (args) {
    var root = config.root
    if (root && root.options) {
      var rootOpts = cliclopts(config.defaults.concat(root.options)).options()
    }
    var parseOpts = xtend(options.minimistOpts || {}, rootOpts)
    var argv = minimist(args, parseOpts)
    debug('parsed', argv)
    var sub = findCommand(argv._, config.commands)
    if (config.all) config.all(argv)
    if (!sub) {
      if (argv._.length === 0 && root && root.command) {
        root.command(argv)
        return true
      }
      if (config.none) config.none(argv)
      return false
    }
    var subMinimistOpts = {}
    var subOpts = config.defaults.concat(sub.command.options || [])
    subMinimistOpts = cliclopts(subOpts).options()
    var subargv = minimist(args, subMinimistOpts)
    subargv._ = subargv._.slice(sub.commandLength)
    process.nextTick(function doCb () {
      sub.command.command(subargv)
    })
    return true
  }
}

function findCommand (args, commands) {
  var match, commandLength
  commands
    .map(function each (c, idx) {
      // turn e.g. 'foo bar' into ['foo', 'bar']
      return {name: c.name.split(' '), index: idx}
    })
    .sort(function each (a, b) {
      return a.name.length > b.name.length
    })
    .forEach(function eachCommand (c) {
      var cmdString = JSON.stringify(c.name)
      var argString = JSON.stringify(args.slice(0, c.name.length))
      if (cmdString === argString) {
        match = commands[c.index]
        commandLength = c.name.length
      }
    })
  var returnData = {command: match, commandLength: commandLength}
  debug('match', match)
  if (match) return returnData
  else return false
}
