"use strict";

module.exports = function(context) {
    function klass(node) {
        const message = "class name should start with upper case.";

        if (context.options.indexOf("class") < 0) {
            return;
        }

        const name = node.id.name;
        const first = name[0];
        if (first !== first.toUpperCase()) {
            context.report(node, message);
        }
    }

    function method(node) {
        const message = "method name should start with lower case.";

        if (context.options.indexOf("method") < 0) {
            return;
        }

        const name = node.key.name;
        const first = name[0];
        if (first !== first.toLowerCase()) {
            context.report(node, message);
        }
    }

    return {
        "ClassDeclaration": klass,
        "MethodDefinition": method
    };
};
