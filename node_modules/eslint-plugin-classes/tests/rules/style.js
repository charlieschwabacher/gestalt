"use strict";

const rule = require("../../lib/rules/style"),
    RuleTester = require("eslint").RuleTester;

const ruleTester = new RuleTester();


const valid = [
    `
    class Foo {
    }
    `,
    `
    class Foo {
        static bar() {}
    }
    `,
    `
    class Foo {
        constructor() {}
    }
    `,
    `
    class Foo {
        baz() {}
    }
    `,
    `
    class Foo {
        static bar() {}
        static bal() {}
        constructor() {}
        baz() {}
        biz() {}
        bez() {}
    }
    `
].map((code) => {
    return {
        code: code,
        ecmaFeatures: { classes: true }
    };
});


const invalid = [
    {
        target: "static method",
        before: "constructor & instance method",
        code: `
        class Foo {
            constructor() {}
            static bar() {}
        }
        `
    },
    {
        target: "static method",
        before: "constructor & instance method",
        code: `
        class Foo {
            baz() {}
            static bar() {}
        }
        `
    },
    {
        target: "constructor",
        before: "instance method",
        code: `
        class Foo {
            baz() {}
            constructor() {}
        }
        `
    },
    {
        target: "static method",
        before: "constructor & instance method",
        code: `
        class Foo {
            baz() {}
            static bar() {}
            constructor() {}
        }
        `
    }
].map((e) => {
    const message = `${e.target} should define before ${e.before}`;
    return {
        code: e.code,
        ecmaFeatures: { classes: true },
        errors: [{ message: message }]
    };
});

ruleTester.run("classes/style", rule, {
    valid: valid,
    invalid: invalid
});
