// transpile:mocha

import chai from 'chai';
import {A} from '../lib/a';

chai.should();

describe('a-throw', () => {
  it('should throw', () => {
    var a = new A('hello world!');
    a.throwError('This is really bad!');
  });
});

