import neo4j from 'neo4j';

const db = new neo4j.GraphDatabase({
  url: 'http://localhost:7474',
  auth: {
    username: 'neo4j',
    password: 'graph'
  },
});


// Resolve multiple queries at once.  Takes an array of objects
// [{opts, resolve, reject}].  It will make a single round trip to neo4j, and
// then call resolve (or reject in case of error) for each query in order.

export function resolveQueries(queries) {
  // console.log(`resolving ${queries.length} queries`);
  db.cypher(
    {queries: queries.map(({opts}) => opts)},
    (err, results) => {
      if (err) {
        queries.forEach(({reject}) => reject(err));
      } else {
        // map through results for each query
        results.map((returnedValues, i) =>
          // map through results returned by each query
          // we take properites of the returned objects, merged with an
          // additional property `_type` containing the first label
          queries[i].resolve(returnedValues.map((result) => {
            return Object.keys(result).reduce((memo, key) => {
              const value = result[key];
              if (typeof value === 'object') {
                memo[key] = Object.assign(
                  {_type: value.labels[0]},
                  value.properties
                );
              } else {
                memo[key] = value;
              }
              return memo;
            }, {})
          }))
        );
      }
    }
  );
}


// This is the standard api we use for querying neo4j - it will batch all
// queries issued at once, and wait until the next tick to resolve them in one
// round trip to the database.  It returns a promise.

let pendingQueries = [];

function resolvePendingQueries() {
  resolveQueries(pendingQueries);
  pendingQueries = [];
}

export function cypher(opts) {
  if (typeof opts === 'string') {
    opts = {query: opts};
  }

  return new Promise((resolve, reject) => {
    if (pendingQueries.length === 0) {
      setTimeout(resolvePendingQueries);
    }
    pendingQueries.push({opts, resolve, reject});
  });
}
