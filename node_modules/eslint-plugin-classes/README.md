# eslint-plugin-classes

custom ESLint rule, checks class style.
(will adding more rules for class)

## Rule Details

### space

should no space between method name and parens.

The following patterns are considered warnings:

```js
class Foo {
  bar () {
  }
}

class Foo {
  static bar () {
  }
}

class Foo {
  bar () {
  }

  buz() {
  }
}
```

The following patterns are not warnings:

```js
class Foo {
  bar() {
  }
}

class Foo {
  static bar() {
  }
}

class Foo {
  bar() {
  }

  buz() {
  }
}
```

### name

- class name should start with upper case.
- method name should start with lower case.

The following patterns are considered warnings:

```js
class foo {
}

class Foo {
  Bar () {
  }
}
```

The following patterns are not warnings:

```js
class Foo {
}

class Foo {
  bar () {
  }
}
```

## constructor

class should have constructor always even if empty body.

The following patterns are considered warnings:

```js
class Foo {
}

class Foo {
  bar() {
  }
}
```

The following patterns are not warnings:

```js
class Foo {
  constructor() {
    console.log('test');
  }
}

class Foo {
  constructor() {
  }

  bar() {
  }
}
```

## super

extended class should call `super()` at the top of constructor.

The following patterns are considered warnings:

```js
class Foo extends A {
  bar() {
  }
}

class Foo extends A {
  constructor() {
    this.bar();
  }
  bar() {
  }
}
```

The following patterns are not warnings:

```js
class Foo extends A {
  constructor() {
    super();
    this.a = 10;
  }
  bar() {
  }
}

class Foo extends A {
  bar() {
  }
  constructor() {
    super();
    this.a = 10;
  }
}

class Foo extends A {
  constructor() {
    // comments
    super();
    this.a = 10;
  }
}
```

## Style

enforce order of definition of method in order of static method => constructor => instance methods.

The following patterns are considered warnings:

```js
class Foo {
    constructor() {}
    static bar() {}
}


class Foo {
    baz() {}
    static bar() {}
    constructor() {}
    baz() {}
}
```

The following patterns are not warnings:

```js
class Foo {
    static bar() {}
    static bal() {}
    constructor() {}
    baz() {}
    biz() {}
    bez() {}
}
```

## Usage

```yaml
plugins:
  - classes

rules:
  # Plugins
  classes/space  : 2
  classes/name   : [2, "class", "method"]
  classes/constructor : 2
  classes/super  : 2
  classes/style  : 2
```

## License

MIT
