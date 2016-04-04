"use strict";

const rule = require("../../lib/rules/space"),
    RuleTester = require("eslint").RuleTester;

const ruleTester = new RuleTester();


const valid = [
    `
    class Foo {
    }
    `,
    `
    class Foo {
      bar() {
      }
    }
    `,
    `
    class Foo {
      static bar() {
      }
    }
    `,
    `
    class Foo {
      bar() {
      }

      buz() {
      }
    }
    `,
    `
    class Foo {
      get bar() {
      }

      set buz(a) {
      }
    }
    `
].map((code) => {
    return {
        code: code,
        ecmaFeatures: { classes: true }
    };
});

const message = "no space between method name and parens";

const invalid = [
    `
    class Foo {
      bar () {
      }
    }
    `,
    `
    class Foo {
      static bar () {
      }
    }
    `,
    `
    class Foo {
      bar () {
      }

      buz() {
      }
    }
    `,
    `
    class Foo {
      get bar () {
      }
    }
    `,
    `
    class Foo {
      set bar (a) {
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

ruleTester.run("classes/space", rule, {
    valid: valid,
    invalid: invalid
});
