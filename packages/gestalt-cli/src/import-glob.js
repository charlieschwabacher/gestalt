import glob from 'glob';

export default function(importPattern) {
  return glob.sync(importPattern)
    .filter(fileName => fileName.match(/\.js$/))
    .map(fileName => require(fileName))
    .filter(module => module.__esModule)
    .reduce((acc, module) => [...acc, ...Object.values(module)], []);
}
