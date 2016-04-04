# subcommand

Create CLI tools with subcommands. A minimalist CLI router based on [minimist](https://www.npmjs.com/package/minimist) and [cliclopts](https://www.npmjs.com/package/cliclopts).

[![NPM](https://nodei.co/npm/subcommand.png)](https://nodei.co/npm/subcommand/)

[![js-standard-style](https://raw.githubusercontent.com/feross/standard/master/badge.png)](https://github.com/feross/standard)

[![Build Status](https://travis-ci.org/maxogden/subcommand.svg?branch=master)](https://travis-ci.org/maxogden/subcommand)

## basic usage

first, define your CLI API in JSON like this:

```js
var commands = [
  {
    name: 'foo',
    options: [ // cliclopts options
      {
        name: 'loud',
        boolean: true,
        default: false,
        abbr: 'v'
      }
    ],
    command: function foo (args) {
      // called when `foo` is matched
    }
  },
  {
    name: 'bar',
    command: function bar (args) {
      // called when `bar` is matched
    }
  }
]
```

then pass them into `subcommand`:

```js
var subcommand = require('subcommand')
var match = subcommand(config, opts)
```

`subcommand` returns a function (called `match` above) that you can use to match/route arguments to their subcommands

the return value will be `true` if a subcommand was matched, or `false` if no subcommand was matched

```js
var matched = match(['foo'])
// matched will be true, and foo's `command` function will be called

var matched = match(['foo', 'baz', 'taco'])
// matched will be true, and foo's `command` function will be called with `['baz', 'taco']`

var matched = match(['bar'])
// matched will be true, and bar's `command` function will be called

var matched = match(['uhoh'])
// matched will be false
```

## advanced usage

instead of an array, you can also pass an object that looks like this as the first argument to `subcommand`:

```
{
  root: // root command options and handler
  defaults: // default options
  all: // function that gets called always, regardless of match or no match
  none: // function that gets called only when there is no matched subcommand
  commands: // the commands array from basic usage
}
```

see `test.js` for a concrete example

### root

to pass options to the 'root' command (e.g. when no subcommand is passed in), set up your config like this:

```js
var config = {
  root: {
    options: [ // cliclopts options
      {
        name: 'loud',
        boolean: true,
        default: false,
        abbr: 'v'
      }
    ],
    command: function (args) {
      // called when no subcommand is specified
    }
  },
  commands: yourSubCommandsArray
}
```

### defaults

you can pass in a defaults options array, and all subcommands as well as the root command will inherit the default options

```js
var config = {
  defaults: [
    {name: 'path', default: process.cwd()} // all commands (and root) will now always have a 'path' default option
  ],
  commands: yourSubCommandsArray
}
```

### all

pass a function under the `all` key and it will get called with the parsed arguments 100% of the time

```js
var config = {
  all: function all (args) { /** will be called always in addition to the command/root `command` handlers **/ },
  commands: yourSubCommandsArray
}
```

### none

pass a function under the `none` key and it will get called when no subcommand is matched

```js
var config = {
  none: function none (args) { /** will only be called when no subcommand is matched **/ },
  commands: yourSubCommandsArray
}
```
