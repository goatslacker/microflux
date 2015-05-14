"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.observeAll = observeAll;
exports.reducers = reducers;
function copy(source, target) {
  return Object.keys(target).reduce(function (obj, key) {
    obj[key] = target[key];
    return obj;
  }, source);
}

function observeAll() {
  for (var _len = arguments.length, manyActions = Array(_len), _key = 0; _key < _len; _key++) {
    manyActions[_key] = arguments[_key];
  }

  return manyActions.reduce(function (signals, actions) {
    return Object.keys(actions).reduce(function (obj, action) {
      obj[action] = actions[action];
      return obj;
    }, {});
  }, {});
}

function reducers(listeners) {
  return function (context, state, signals) {
    return Object.keys(signals).filter(function (x) {
      return signals[x] != null;
    }).reduce(function (nextState, signal) {
      return listeners[signal] ? copy(state, listeners[signal](context, nextState, signals[signal])) : nextState;
    }, state);
  };
}
