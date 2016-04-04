"use strict";

const rule = require("../../lib/rules/constructor"),
    RuleTester = require("eslint").RuleTester;

const ruleTester = new RuleTester();


const valid = [
    `
    class Foo {
      constructor() {
      }

      set buz(a) {
      }
    }
    `,
    `
    class Foo {
      constructor() {
      }
    }
    `,
    `
    class Foo {
      constructor() {
      }

      foo() {
      }
    }
    `
].map((code) => {
    return {
        code: code,
        ecmaFeatures: { classes: true }
    };
});

const message = "class should have constructor";

const invalid = [
    `
    class Foo {
    }
    `,
    `
    class Foo {
      bar() {
      }
    }
    `
].map((code) => {
    return {
        code: code,
        ecmaFeatures: { classes: true },
        errors: [{ message: message }]
    };
});

ruleTester.run("classes/constructor", rule, {
    valid: valid,
    invalid: invalid
});
