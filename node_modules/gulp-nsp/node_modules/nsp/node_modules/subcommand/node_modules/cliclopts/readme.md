# cliclopts
[![NPM](https://nodei.co/npm/cliclopts.png)](https://nodei.co/npm/cliclopts/)

![cliclopts](cliclopts.png)

Command line options helper and usage printer, works well with [minimist](https://www.npmjs.com/package/minimist), inspired by [nomnom](https://www.npmjs.com/package/nomnom)

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

## usage

Define the allowed options in an array and pass it to 'cliclopts'

```js
var cliclopts = require('cliclopts')

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
    default: './dat.json',
    help: 'path to file'
  }
]

var cliOpts = cliclopts(options)
```
### cliclopts(options)

options is an array of objects with the following possible keys:

* `name` primary name of option
* `abbr` one character alias of the option
* `alias` other options treated as alias
* `boolean` if true the option is seen as a boolean flag
* `help` usage string for the option
* `default` default value of the option


### cliOpts.usage()

Returns the usage information as string:

```
--verbose, -v         be verbose
--path, -p            path to file (default: "dat.json")
```

### cliOpts.print()

Prints the usage information.

### cliOpts.boolean()

Returns Array of all command names that are specified as boolean.

### cliOpts.alias()

Returns Object with command names as keys and alias list as value (including abbr)

### cliOpts.default()

Returns Object with command names as keys and default values as values.

### cliOpts.options()

Returns
```js
{
  alias: cliOpts.alias(),
  boolean: cliOpts.boolean(),
  default: cliOpts.default()
}
```


## Example usage with `minimist`
```js
var allowedOptions = [
  {
    name: 'verbose',
    abbr: 'v',
    alias: ['cry-at-me'],
    boolean: true,
    help: 'be verbose'
  },
  {
    name: 'path',
    abbr: 'p',
    help: 'path to the file'
  },
  {
    name: 'help',
    abbr: 'h',
    help: 'show help',
    boolean: true
  }
]

var cliOpts = require('cliclopts')(allowedOptions)

var argv = require('minimist')(process.argv.slice(2), cliOpts.options())

if (argv.help) {
  console.log('Usage: command [options]')
  cliOpts.print()
  process.exit()
}

yourprogram(argv)
```

