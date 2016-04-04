/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

// Helpers for creating connection types in the schema
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _connectionConnectionJs = require('./connection/connection.js');

// Helpers for creating connections from arrays
Object.defineProperty(exports, 'backwardConnectionArgs', {
  enumerable: true,
  get: function get() {
    return _connectionConnectionJs.backwardConnectionArgs;
  }
});
Object.defineProperty(exports, 'connectionArgs', {
  enumerable: true,
  get: function get() {
    return _connectionConnectionJs.connectionArgs;
  }
});
Object.defineProperty(exports, 'connectionDefinitions', {
  enumerable: true,
  get: function get() {
    return _connectionConnectionJs.connectionDefinitions;
  }
});
Object.defineProperty(exports, 'forwardConnectionArgs', {
  enumerable: true,
  get: function get() {
    return _connectionConnectionJs.forwardConnectionArgs;
  }
});

var _connectionArrayconnectionJs = require('./connection/arrayconnection.js');

// Helper for creating mutations with client mutation IDs
Object.defineProperty(exports, 'connectionFromArray', {
  enumerable: true,
  get: function get() {
    return _connectionArrayconnectionJs.connectionFromArray;
  }
});
Object.defineProperty(exports, 'connectionFromArraySlice', {
  enumerable: true,
  get: function get() {
    return _connectionArrayconnectionJs.connectionFromArraySlice;
  }
});
Object.defineProperty(exports, 'connectionFromPromisedArray', {
  enumerable: true,
  get: function get() {
    return _connectionArrayconnectionJs.connectionFromPromisedArray;
  }
});
Object.defineProperty(exports, 'connectionFromPromisedArraySlice', {
  enumerable: true,
  get: function get() {
    return _connectionArrayconnectionJs.connectionFromPromisedArraySlice;
  }
});
Object.defineProperty(exports, 'cursorForObjectInConnection', {
  enumerable: true,
  get: function get() {
    return _connectionArrayconnectionJs.cursorForObjectInConnection;
  }
});
Object.defineProperty(exports, 'cursorToOffset', {
  enumerable: true,
  get: function get() {
    return _connectionArrayconnectionJs.cursorToOffset;
  }
});
Object.defineProperty(exports, 'getOffsetWithDefault', {
  enumerable: true,
  get: function get() {
    return _connectionArrayconnectionJs.getOffsetWithDefault;
  }
});
Object.defineProperty(exports, 'offsetToCursor', {
  enumerable: true,
  get: function get() {
    return _connectionArrayconnectionJs.offsetToCursor;
  }
});

var _mutationMutationJs = require('./mutation/mutation.js');

// Helper for creating node definitions
Object.defineProperty(exports, 'mutationWithClientMutationId', {
  enumerable: true,
  get: function get() {
    return _mutationMutationJs.mutationWithClientMutationId;
  }
});

var _nodeNodeJs = require('./node/node.js');

// Helper for creating plural identifying root fields
Object.defineProperty(exports, 'nodeDefinitions', {
  enumerable: true,
  get: function get() {
    return _nodeNodeJs.nodeDefinitions;
  }
});

var _nodePluralJs = require('./node/plural.js');

// Utilities for creating global IDs in systems that don't have them.
Object.defineProperty(exports, 'pluralIdentifyingRootField', {
  enumerable: true,
  get: function get() {
    return _nodePluralJs.pluralIdentifyingRootField;
  }
});
Object.defineProperty(exports, 'fromGlobalId', {
  enumerable: true,
  get: function get() {
    return _nodeNodeJs.fromGlobalId;
  }
});
Object.defineProperty(exports, 'globalIdField', {
  enumerable: true,
  get: function get() {
    return _nodeNodeJs.globalIdField;
  }
});
Object.defineProperty(exports, 'toGlobalId', {
  enumerable: true,
  get: function get() {
    return _nodeNodeJs.toGlobalId;
  }
});