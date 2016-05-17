
/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

var _Promise = require('babel-runtime/core-js/promise')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.connectionFromArray = connectionFromArray;
exports.connectionFromPromisedArray = connectionFromPromisedArray;
exports.connectionFromArraySlice = connectionFromArraySlice;
exports.connectionFromPromisedArraySlice = connectionFromPromisedArraySlice;
exports.offsetToCursor = offsetToCursor;
exports.cursorToOffset = cursorToOffset;
exports.cursorForObjectInConnection = cursorForObjectInConnection;
exports.getOffsetWithDefault = getOffsetWithDefault;

var _utilsBase64Js = require('../utils/base64.js');

/**
 * A simple function that accepts an array and connection arguments, and returns
 * a connection object for use in GraphQL. It uses array offsets as pagination,
 * so pagination will only work if the array is static.
 */

function connectionFromArray(data, args) {
  return connectionFromArraySlice(data, args, {
    sliceStart: 0,
    arrayLength: data.length
  });
}

/**
 * A version of `connectionFromArray` that takes a promised array, and returns a
 * promised connection.
 */

function connectionFromPromisedArray(dataPromise, args) {
  return dataPromise.then(function (data) {
    return connectionFromArray(data, args);
  });
}

/**
 * Given a slice (subset) of an array, returns a connection object for use in
 * GraphQL.
 *
 * This function is similar to `connectionFromArray`, but is intended for use
 * cases where you know the cardinality of the connection, consider it too large
 * to materialize the entire array, and instead wish pass in a slice of the
 * total result large enough to cover the range specified in `args`.
 */

function connectionFromArraySlice(arraySlice, args, meta) {
  var after = args.after;
  var before = args.before;
  var first = args.first;
  var last = args.last;
  var sliceStart = meta.sliceStart;
  var arrayLength = meta.arrayLength;

  var sliceEnd = sliceStart + arraySlice.length;
  var beforeOffset = getOffsetWithDefault(before, arrayLength);
  var afterOffset = getOffsetWithDefault(after, -1);

  var startOffset = Math.max(sliceStart - 1, afterOffset, -1) + 1;
  var endOffset = Math.min(sliceEnd, beforeOffset, arrayLength);
  if (typeof first === 'number') {
    endOffset = Math.min(endOffset, startOffset + first);
  }
  if (typeof last === 'number') {
    startOffset = Math.max(startOffset, endOffset - last);
  }

  // If supplied slice is too large, trim it down before mapping over it.
  var slice = arraySlice.slice(Math.max(startOffset - sliceStart, 0), arraySlice.length - (sliceEnd - endOffset));

  var edges = slice.map(function (value, index) {
    return {
      cursor: offsetToCursor(startOffset + index),
      node: value
    };
  });

  var firstEdge = edges[0];
  var lastEdge = edges[edges.length - 1];
  var lowerBound = after ? afterOffset + 1 : 0;
  var upperBound = before ? beforeOffset : arrayLength;
  return {
    edges: edges,
    pageInfo: {
      startCursor: firstEdge ? firstEdge.cursor : null,
      endCursor: lastEdge ? lastEdge.cursor : null,
      hasPreviousPage: typeof last === 'number' ? startOffset > lowerBound : false,
      hasNextPage: typeof first === 'number' ? endOffset < upperBound : false
    }
  };
}

/**
 * A version of `connectionFromArraySlice` that takes a promised array slice,
 * and returns a promised connection.
 */

function connectionFromPromisedArraySlice(dataPromise, args, arrayInfo) {
  return dataPromise.then(function (data) {
    return connectionFromArraySlice(data, args, arrayInfo);
  });
}

var PREFIX = 'arrayconnection:';

/**
 * Creates the cursor string from an offset.
 */

function offsetToCursor(offset) {
  return (0, _utilsBase64Js.base64)(PREFIX + offset);
}

/**
 * Rederives the offset from the cursor string.
 */

function cursorToOffset(cursor) {
  return parseInt((0, _utilsBase64Js.unbase64)(cursor).substring(PREFIX.length), 10);
}

/**
 * Return the cursor associated with an object in an array.
 */

function cursorForObjectInConnection(data, object) {
  var offset = data.indexOf(object);
  if (offset === -1) {
    return null;
  }
  return offsetToCursor(offset);
}

/**
 * Given an optional cursor and a default offset, returns the offset
 * to use; if the cursor contains a valid offset, that will be used,
 * otherwise it will be the default.
 */

function getOffsetWithDefault(cursor, defaultOffset) {
  if (typeof cursor !== 'string') {
    return defaultOffset;
  }
  var offset = cursorToOffset(cursor);
  return isNaN(offset) ? defaultOffset : offset;
}