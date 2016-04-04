"use strict";

const rule = require("../../lib/rules/name"),
    RuleTester = require("eslint").RuleTester;

const ruleTester = new RuleTester();


const valid = [
    `
    class Foo {
    }
    `,
    `
    class Foo {
      bar() {}
    }
    `
].map((code) => {
    return {
        code: code,
        options: [ 1, "class", "method" ],
        ecmaFeatures: { classes: true }
    };
});

const klass = "class name should start with upper case.";

const invalidClass = [
    `
    class foo {
    }
    `
].map((code) => {
    return {
        code: code,
        options: [ 1, "class", "method" ],
        ecmaFeatures: { classes: true },
        errors: [{ message: klass }]
    };
});

const method = "method name should start with lower case.";

const invalidMethod = [
    `
    class Foo {
      Bar(){}
    }
    `
].map((code) => {
    return {
        code: code,
        options: [ 1, "class", "method" ],
        ecmaFeatures: { classes: true },
        errors: [{ message: method }]
    };
});

ruleTester.run("classes/name", rule, {
    valid: valid,
    invalid: invalidClass.concat(invalidMethod)
});
