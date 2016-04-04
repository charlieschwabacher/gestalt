import {cypher} from './db';
import {GraphQLList} from 'graphql';

export function planToCypher(type, id, plan) {
  const {matches, returns} = subPlanToCypher('root', plan);
  matches.unshift(`MATCH (root:${type.name} {id:'${id}'})`);
  returns.unshift('root');
  return `${matches.join(' ')} RETURN ${returns.join(', ')}`;
}

function edges(plan) {
  const fieldNames = Object.keys(plan.returned.fields);
  const edgeNames = Object.keys(plan.returnType.edges);
  return fieldNames.filter(name => edgeNames.indexOf(name) > -1);
}

function subPlanToCypher(fromIdentifier, plan) {
  edges(plan).forEach((edgeName) => {
    const field = plan.returned.fields[edgeName];
    console.log(`\n\n${fromIdentifier} LOOKING AT FIELD ${edgeName}\n`, field);

    const edge = plan.returnType.edges[edgeName]
    console.log(`\n\n${fromIdentifier} LOOKING AT EDGE ${edgeName}\n`, edge);

    let isList, targetType;
    if (edge.type instanceof GraphQLList) {
      isList = true;
      targetType = edge.type.ofType;
    } else {
      isList = false;
      targetType = edge.type;
    }

    const targetIdentifier = `${fromIdentifier}_${edgeName}`;
    const path = edge.path.reduce((memo, step) => {

    }, '');

    matches = [`${fromIdentifier}${path}${targetIdentifier}`]

    return {matches, returns};
  });
}

// takes a flat list of named nodes returned from neo4j, and a map of node ids
// to positions, and assembles them into the expected tree structure.
export function constructResultTree(results) {
  return results.n1;
}


export default async function resolve(type, id, plan) {
  console.log('neo4j resolve called');

  try {
    const {query, nodeIdMap} = planToCypher(type, id, plan);
    console.log('\n\nmaking cyper query:\n', query);
    console.log('\n\nnode id map:\n', nodeIdMap);

    const [results] = await cypher(query);
    console.log('\n\nneo4j resolve results:\n', results);

    const resultTree = constructResultTree(results);
    console.log('\n\nconstructed result tree:\n', resultTree)

    return resultTree;
  } catch (e) {
    console.log('\n\nneo4j resolve error\n');
    console.log(e);
  }
}
