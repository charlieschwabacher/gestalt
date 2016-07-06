import glob from 'glob';

export default function(importPattern) {
  return glob.sync(importPattern)
    .filter(fileName => fileName.match(/\.js$/))
    .map(fileName => {
      console.log(fileName);
      return require(fileName);
    })
    .filter(module => module.__esModule)
    .reduce((acc, module) => {
      console.log(module);
      return [...acc, ...Object.values(module)];
    }, []);
}
