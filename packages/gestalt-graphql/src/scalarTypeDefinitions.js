export default {
  Date: {
    serialize: v => v,
    parseValue: v => v,
    parseLiteral: ast => ast.value,
  },
  Money: {
    serialize: v => v,
    parseValue: v => v,
    parseLiteral: ast => ast.value,
  },
};
