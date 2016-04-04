var RegClient = require('..');
var os = require('os');

var client = new RegClient({
  registry: 'http://registry.npmjs.org/',
  cache: os.tmpDir() + '/' + Math.random().toString(16).slice(2)
});

client.get('/browserify', function (err, pkg) {
  if (err) throw err;
  console.log('got pkg with keys [%s]', Object.keys(pkg).join(', '));
});
