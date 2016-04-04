var test = require('tape')
var sub = require('./')

function testCommands (onMatch, onAll, onNone) {
  var config = {
    root: {
      options: [{
        name: 'version',
        boolean: true,
        abbr: 'v'
      }],
      command: function noCommand (args) {
        onMatch('noCommand', args)
      }
    },
    defaults: [{
      name: 'taco',
      boolean: true,
      abbr: 't'
    }],
    all: onAll,
    none: onNone,
    commands: [
      {
        name: 'cat',
        options: [
          {
            name: 'live',
            boolean: true,
            default: true,
            abbr: 'l'
          },
          {
            name: 'format',
            boolean: false,
            default: 'csv',
            abbr: 'f'
          }
        ],
        command: function cat (args) {
          onMatch('cat', args)
        }
      },
      {
        name: 'cat foo',
        command: function catFoo (args) {
          onMatch('cat foo', args)
        }
      },
      {
        name: 'cat foo bar',
        command: function catFooBar (args) {
          onMatch('cat foo bar', args)
        }
      }
    ]
  }

  return config
}

test('match basic subcommand with no args', function (t) {
  var args = sub([{
    name: 'foo',
    command: function foo (args) {
      t.equal(args._.length, 0, 'no args')
      t.end()
    }
  }])
  var handled = args(['foo'])
  t.equal(handled, true, 'returned true')
})

test('match basic subcommand with 1 extra arg', function (t) {
  var args = sub([{
    name: 'foo',
    command: function foo (args) {
      t.equal(args._.length, 1, '1 arg')
      t.equal(args._[0], 'bar', 'bar')
      t.end()
    }
  }])
  var handled = args(['foo', 'bar'])
  t.equal(handled, true, 'returned true')
})

test('match basic subcommand with 5 extra args', function (t) {
  var args = sub([{
    name: 'foo',
    command: function foo (args) {
      t.equal(args._.length, 5, '5 args')
      t.equal(JSON.stringify(args._), JSON.stringify(['bar', 'taco', 'pizza', 'walrus', 'muffin']), 'args match')
      t.end()
    }
  }])
  var handled = args(['foo', 'bar', 'taco', 'pizza', 'walrus', 'muffin'])
  t.equal(handled, true, 'returned true')
})

test('match 1 arg command w/ 1 extra arg', function (t) {
  function onMatch (matched, args) {
    t.equal(matched, 'cat')
    t.equal(args._.length, 1, '1 arg')
    t.equal(args._[0], 'taco', 'taco')
    t.end()
  }
  var args = sub(testCommands(onMatch))
  var handled = args(['cat', 'taco'])
  t.equal(handled, true, 'returned true')
})

test('match 2 arg command w/ 1 extra arg', function (t) {
  function onMatch (matched, args) {
    t.equal(matched, 'cat foo')
    t.equal(args._.length, 1, '1 arg')
    t.equal(args._[0], 'baz', 'baz')
    t.end()
  }
  var args = sub(testCommands(onMatch))
  var handled = args(['cat', 'foo', 'baz'])
  t.equal(handled, true, 'returned true')
})

test('match 3 arg command w/ 1 extra arg', function (t) {
  function onMatch (matched, args) {
    t.equal(matched, 'cat foo bar')
    t.equal(args._.length, 1, '1 arg')
    t.equal(args._[0], 'muffin', 'muffin')
    t.end()
  }
  var args = sub(testCommands(onMatch))
  var handled = args(['cat', 'foo', 'bar', 'muffin'])
  t.equal(handled, true, 'returned true')
})

test('match top level option using abbr', function (t) {
  function onMatch (matched, args) {
    t.equal(matched, 'noCommand')
    t.equal(args.version, true, 'got version')
    t.end()
  }
  var args = sub(testCommands(onMatch))
  var handled = args(['-v'])
  t.equal(handled, true, 'returned true')
})

test('default options', function (t) {
  function onMatch (matched, args) {
    t.equal(matched, 'noCommand')
    t.equal(args.taco, true, 'got taco')
    t.end()
  }
  var args = sub(testCommands(onMatch))
  var handled = args(['-t'])
  t.equal(handled, true, 'returned true')
})

test('commands with no options still get defaults', function (t) {
  function onMatch (matched, args) {
    t.equal(matched, 'cat foo')
    t.equal(args.taco, true, 'got taco')
    t.end()
  }
  var args = sub(testCommands(onMatch))
  var handled = args(['cat', 'foo', '-t'])
  t.equal(handled, true, 'returned true')
})

test('default options are overridden', function (t) {
  var args = sub({
    defaults: [{name: 'foo', default: 'donkey'}],
    root: {
      options: [{name: 'foo', default: 'pizza'}],
      command: function root (args) {
        t.equal(args.foo, 'pizza', 'pizza')
        t.end()
      }
    }
  })
  var handled = args([])
  t.equal(handled, true, 'returned true')
})

test('all handler', function (t) {
  t.plan(6)
  function onMatch (matched, args) {
    t.ok(true, 'called onMatch')
  }
  function onAll (args) {
    t.ok(true, 'called onAll')
  }
  var args = sub(testCommands(onMatch, onAll))
  var handled = args(['--foo', 'bar'])
  t.equal(handled, true, 'returned true')
  var handled2 = args(['cat', 'taco'])
  t.equal(handled2, true, 'returned true')
})

test('none handler', function (t) {
  t.plan(5)
  function onMatch (matched, args) {
    t.ok(true, 'called onMatch')
  }
  function onNone (args) {
    t.ok(true, 'called onNone')
    t.equal(args._[0], 'buffalo', 'buffalo')
  }
  var args = sub(testCommands(onMatch, null, onNone))
  var handled = args(['cat'])
  t.equal(handled, true, 'returned true')
  var handled2 = args(['buffalo', 'wings'])
  t.equal(handled2, false, 'returned true')
})
