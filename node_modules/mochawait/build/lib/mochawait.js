'use strict';

var _slicedToArray = require('babel-runtime/helpers/sliced-to-array')['default'];

var _regeneratorRuntime = require('babel-runtime/regenerator')['default'];

var _Map = require('babel-runtime/core-js/map')['default'];

var _getIterator = require('babel-runtime/core-js/get-iterator')['default'];

var mochawait = {},
    mochaIt = GLOBAL.it,
    mochaBefore = GLOBAL.before,
    mochaBeforeEach = GLOBAL.beforeEach,
    mochaAfter = GLOBAL.after,
    mochaAfterEach = GLOBAL.afterEach;

mochawait.it = function (desc, asyncFn) {
  mochaIt(desc, function callee$1$0(done) {
    return _regeneratorRuntime.async(function callee$1$0$(context$2$0) {
      while (1) switch (context$2$0.prev = context$2$0.next) {
        case 0:
          context$2$0.prev = 0;
          context$2$0.next = 3;
          return _regeneratorRuntime.awrap(asyncFn.call(this));

        case 3:
          done();
          context$2$0.next = 9;
          break;

        case 6:
          context$2$0.prev = 6;
          context$2$0.t0 = context$2$0['catch'](0);

          done(context$2$0.t0);

        case 9:
        case 'end':
          return context$2$0.stop();
      }
    }, null, this, [[0, 6]]);
  });
};

var mochaHooks = new _Map();
mochaHooks.set('before', mochaBefore);
mochaHooks.set('after', mochaAfter);
mochaHooks.set('beforeEach', mochaBeforeEach);
mochaHooks.set('afterEach', mochaAfterEach);

var _iteratorNormalCompletion = true;
var _didIteratorError = false;
var _iteratorError = undefined;

try {
  var _loop = function () {
    var _step$value = _slicedToArray(_step.value, 2);

    var name = _step$value[0];
    var hook = _step$value[1];

    GLOBAL[name] = function (asyncFn) {
      hook(function callee$2$0(done) {
        return _regeneratorRuntime.async(function callee$2$0$(context$3$0) {
          while (1) switch (context$3$0.prev = context$3$0.next) {
            case 0:
              context$3$0.prev = 0;
              context$3$0.next = 3;
              return _regeneratorRuntime.awrap(asyncFn.call(this));

            case 3:
              done();
              context$3$0.next = 9;
              break;

            case 6:
              context$3$0.prev = 6;
              context$3$0.t0 = context$3$0['catch'](0);

              done(context$3$0.t0);

            case 9:
            case 'end':
              return context$3$0.stop();
          }
        }, null, this, [[0, 6]]);
      });
    };
  };

  for (var _iterator = _getIterator(mochaHooks), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
    _loop();
  }
} catch (err) {
  _didIteratorError = true;
  _iteratorError = err;
} finally {
  try {
    if (!_iteratorNormalCompletion && _iterator['return']) {
      _iterator['return']();
    }
  } finally {
    if (_didIteratorError) {
      throw _iteratorError;
    }
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9tb2NoYXdhaXQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLElBQUksU0FBUyxHQUFHLEVBQUU7SUFDZCxPQUFPLEdBQUcsTUFBTSxDQUFDLEVBQUU7SUFDbkIsV0FBVyxHQUFHLE1BQU0sQ0FBQyxNQUFNO0lBQzNCLGVBQWUsR0FBRyxNQUFNLENBQUMsVUFBVTtJQUNuQyxVQUFVLEdBQUcsTUFBTSxDQUFDLEtBQUs7SUFDekIsY0FBYyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUM7O0FBRXRDLFNBQVMsQ0FBQyxFQUFFLEdBQUcsVUFBQyxJQUFJLEVBQUUsT0FBTyxFQUFLO0FBQ2hDLFNBQU8sQ0FBQyxJQUFJLEVBQUUsb0JBQWdCLElBQUk7Ozs7OzsyQ0FFeEIsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7OztBQUN4QixjQUFJLEVBQUUsQ0FBQzs7Ozs7Ozs7QUFFUCxjQUFJLGdCQUFHLENBQUM7Ozs7Ozs7R0FFWCxDQUFDLENBQUM7Q0FDSixDQUFDOztBQUVGLElBQUksVUFBVSxHQUFHLFVBQVMsQ0FBQztBQUMzQixVQUFVLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxXQUFXLENBQUMsQ0FBQztBQUN0QyxVQUFVLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQztBQUNwQyxVQUFVLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxlQUFlLENBQUMsQ0FBQztBQUM5QyxVQUFVLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxjQUFjLENBQUMsQ0FBQzs7Ozs7Ozs7OztRQUVsQyxJQUFJO1FBQUUsSUFBSTs7QUFDbEIsVUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLFVBQUMsT0FBTyxFQUFLO0FBQzFCLFVBQUksQ0FBQyxvQkFBZ0IsSUFBSTs7Ozs7OytDQUVmLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDOzs7QUFDeEIsa0JBQUksRUFBRSxDQUFDOzs7Ozs7OztBQUVQLGtCQUFJLGdCQUFHLENBQUM7Ozs7Ozs7T0FFWCxDQUFDLENBQUM7S0FDSixDQUFDOzs7QUFWSixvQ0FBeUIsVUFBVSw0R0FBRTs7R0FXcEMiLCJmaWxlIjoibGliL21vY2hhd2FpdC5qcyIsInNvdXJjZXNDb250ZW50IjpbImxldCBtb2NoYXdhaXQgPSB7fVxuICAsIG1vY2hhSXQgPSBHTE9CQUwuaXRcbiAgLCBtb2NoYUJlZm9yZSA9IEdMT0JBTC5iZWZvcmVcbiAgLCBtb2NoYUJlZm9yZUVhY2ggPSBHTE9CQUwuYmVmb3JlRWFjaFxuICAsIG1vY2hhQWZ0ZXIgPSBHTE9CQUwuYWZ0ZXJcbiAgLCBtb2NoYUFmdGVyRWFjaCA9IEdMT0JBTC5hZnRlckVhY2g7XG5cbm1vY2hhd2FpdC5pdCA9IChkZXNjLCBhc3luY0ZuKSA9PiB7XG4gIG1vY2hhSXQoZGVzYywgYXN5bmMgZnVuY3Rpb24gKGRvbmUpIHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgYXN5bmNGbi5jYWxsKHRoaXMpO1xuICAgICAgZG9uZSgpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGRvbmUoZSk7XG4gICAgfVxuICB9KTtcbn07XG5cbmxldCBtb2NoYUhvb2tzID0gbmV3IE1hcCgpO1xubW9jaGFIb29rcy5zZXQoJ2JlZm9yZScsIG1vY2hhQmVmb3JlKTtcbm1vY2hhSG9va3Muc2V0KCdhZnRlcicsIG1vY2hhQWZ0ZXIpO1xubW9jaGFIb29rcy5zZXQoJ2JlZm9yZUVhY2gnLCBtb2NoYUJlZm9yZUVhY2gpO1xubW9jaGFIb29rcy5zZXQoJ2FmdGVyRWFjaCcsIG1vY2hhQWZ0ZXJFYWNoKTtcblxuZm9yIChsZXQgW25hbWUsIGhvb2tdIG9mIG1vY2hhSG9va3MpIHtcbiAgR0xPQkFMW25hbWVdID0gKGFzeW5jRm4pID0+IHtcbiAgICBob29rKGFzeW5jIGZ1bmN0aW9uIChkb25lKSB7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBhc3luY0ZuLmNhbGwodGhpcyk7XG4gICAgICAgIGRvbmUoKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgZG9uZShlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbn1cbiJdfQ==