
# silent-npm-registry-client

A version of
[npm-registry-client](https://github.com/isaacs/npm-registry-client) that
doesn't spam stdout/stderr by default.

## Usage

```js
var RegClient = require('silent-npm-registry-client');
var os = require('os');

var client = new RegClient({
  registry: 'http://registry.npmjs.org/',
  cache: os.tmpDir() + '/' + Math.random().toString(16).slice(2)
});

client.get('/browserify', function (err, pkg) {
  if (err) throw err;
  console.log('got pkg with keys [%s]', Object.keys(pkg).join(', '));
});
```

## API

The API is exactly the same as
[npm-registry-client](https://github.com/isaacs/npm-registry-client)'s, except
that `options.log` falls back to not logging, even if `npm-log` is installed.

## Installation

With [npm](http://npmjs.org) do

```bash
$ npm install silent-npm-registry-client
```

## License

Copyright (c) 2013 Julian Gruber &lt;julian@juliangruber.com&gt;

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
