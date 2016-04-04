"use strict";

module.exports = function(context) {
    const message = "no space between method name and parens";

    function space(node) {
        const key = node.key;
        const paren = context.getTokenAfter(key);

        if (key.range[1] !== paren.range[0]) {
            context.report(node, message);
        }
    }

    return {
        "MethodDefinition": space
    };
};
