Getting Started:
----------------

This repo contains all of the gestalt packages - `gestalt-cli`,
`gestalt-graphql`, `gestalt-postgres`, `gestalt-server`, and `gestalt-utils` -
and uses [lerna](//github.com/lerna/lerna) to link local dependencies for
development.

To get started with development:

`npm install` in the project root.

`npm run bootstrap` in the project root to install dependencies for and cross
link the individual packages.


Compiling Source:
-----------------

To compile source for all packages `npm run build` from the project root.

To compile source for an individual package, `npm run build` from the package
root.

To watch source files within a package and compile any time they are changed,
`npm run watch` from the package root.


Running Tests:
--------------

Before opening a pull, please run tests, lint, and type check with
[flow](https://flowtype.org/).

To run tests against all packages `npm test` from the project root.

To lint all packages, `npm run lint` from the project root.

To type check all packages, `npm run check` from the project root.
