"use strict";

const rule = require("../../lib/rules/super"),
    RuleTester = require("eslint").RuleTester;

const ruleTester = new RuleTester();


const valid = [
    `
    class Foo extends A {
      constructor() {
        super();
        this.a = 10;
      }
      bar() {
      }
    }
    `,
    `
    class Foo extends A {
      bar() {
      }
      constructor() {
        super();
        this.a = 10;
      }
    }
    `,
    `
    class Foo extends A {
      constructor() {
        // comments
        super();
        this.a = 10;
      }
    }
    `
].map((code) => {
    return {
        code: code,
        ecmaFeatures: { classes: true }
    };
});

const message = "super() should call at top of constructor";

const invalid = [
    `
    class Foo extends A {
      bar() {
      }
    }
    `,
    `
    class Foo extends A {
      constructor() {
        this.bar();
      }
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

ruleTester.run("classes/super", rule, {
    valid: valid,
    invalid: invalid
});
