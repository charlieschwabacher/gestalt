Testing Gestalt
---------------

Gestalt's tests are defined inside the individual packages
(`packages/*/tests/*.js`).  This directory includes only the `mocha.opts`
configuration file to run tests across packages from the project root.


- To run tests on an individual package, `npm test` from the package root


- To run tests against all packages `npm test` from the project root.


- To lint all packages, `npm run lint` from the project root.


- To type check all packages, `npm run check` from the project root.
