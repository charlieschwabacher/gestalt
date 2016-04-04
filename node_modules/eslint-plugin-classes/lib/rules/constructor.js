"use strict";

module.exports = function(context) {
    const message = "class should have constructor";

    function constructorCheck(node) {
        const hasConstructor = node.body.some((token) => {
            return token.kind === "constructor";
        });

        if (!hasConstructor) {
            context.report(node, message);
        }
    }

    return {
        "ClassBody": constructorCheck
    };
};
