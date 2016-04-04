import {cypher} from './db';

export default async function reset({nodes, edges, types}) {
  console.log('Clearing and re-seeding neo4j db');
  const startTime = new Date;

  try {
    // empty database
    console.log('Deleting existing nodes and edges...');
    await cypher('MATCH (n) DETACH DELETE n');

    // create indexes (index every node type on id)
    console.log('Creating indexes...');
    await Promise.all(
      types.map((typeName) => cypher(`CREATE INDEX ON :${typeName}(id)`))
    );

    // create nodes
    console.log('Creating nodes...');
    for (const type in nodes) {
      console.log(`  ${type}`);
      const models = nodes[type];
      await Promise.all(
        models.map((model, i) => cypher({
          query: `
            CREATE (n:${type} {${
              Object.keys(model).map((k) => `${k}:{${k}}`).join(',')
            }})
          `,
          params: model
        }))
      );
    }

    // create edges
    console.log('Creating edges...');
    await Promise.all(
      edges.map(([from, relationship, to]) => cypher({
        query: `
          MATCH (from {id: {fromId}})
          MATCH (to {id: {toId}})
          CREATE (from)-[:${relationship}]->(to)
        `,
        params: {fromId: from.id, toId: to.id}
      }))
    );

  } catch (err) {
    console.log(err.stack);
  }

  console.log(`DB reset in ${(new Date - startTime) / 1000} seconds\n`);
}
