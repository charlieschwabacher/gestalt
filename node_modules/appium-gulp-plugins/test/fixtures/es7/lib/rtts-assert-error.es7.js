// transpile:main

import {A} from './a';

// A expect a string, we pass an integer
let a = new A(123);

console.log(a.getText());

