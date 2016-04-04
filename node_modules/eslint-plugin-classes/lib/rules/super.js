"use strict";

module.exports = function(context) {
    const message = "super() should call at top of constructor";

    function constructorCheck(node) {
        if (node.parent.superClass === null) {
            return; // not extend class
        }

        let noConstructor = true;
        for (let method of node.body) {
            if (method.kind !== "constructor") {
                continue;
            }

            noConstructor = false;

            let body = method.value.body.body[0];

            let isExpression = body.type === "ExpressionStatement";
            let isCallExpression = body.expression.type === "CallExpression";
            let isSuper = context.getFirstToken(body).value === "super";

            if (isExpression && isCallExpression && isSuper) {
                break;
            }

            context.report(body, message);
        }

        if (noConstructor) {
            context.report(node, message);
        }
    }

    return {
        "ClassBody": constructorCheck
    };
};
