"use strict";

module.exports = function(context) {
    function style(node) {
        let state = 0; // static:0, constructor:1, method:2

        for (let token of node.body) {
            let kind = token.kind;
            if (token.static) {
                kind = "static";
            }

            switch (kind) {
                case "static":
                    if (state > 0) {
                        let target = "static method";
                        let before = "constructor & instance method";
                        let message = `${target} should define before ${before}`;
                        return context.report(node, message);
                    }
                    break;

                case "constructor":
                    if (state === 0) {
                        state = 1;
                    }
                    if (state > 1) {
                        let target = "constructor";
                        let before = "instance method";
                        let message = `${target} should define before ${before}`;
                        return context.report(node, message);
                    }
                    break;
                case "method":
                    state = 2;
                    break;
                default:
                    break;
            }
        }
    }

    return {
        "ClassBody": style
    };
};
