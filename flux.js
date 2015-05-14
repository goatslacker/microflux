'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _flux = require('flux');

var _transmitter = require('transmitter');

var _transmitter2 = _interopRequireDefault(_transmitter);

var BOOTSTRAP = {};

function createActions(context, name, model) {
  return Object.keys(model).reduce(function (actions, id) {
    var action = function action() {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      var data = model[id].apply(model, args);
      context.dispatcher.dispatch({ action: action, data: data });
    };
    actions[id] = action;
    return actions;
  }, {});
}

function createStore(context, name, model) {
  var state = model.state;
  var bus = (0, _transmitter2['default'])();

  var observables = model.observe(context, state);

  // setup the dependencies and signals
  var dependencies = Object.keys(observables).map(function (key) {
    return observables[key].dispatchToken;
  }).filter(Boolean);

  var dispatchToken = context.dispatcher.register(function (payload) {
    // bootstrap state
    if (payload.action === BOOTSTRAP && payload.data[name]) {
      return state = payload.data[name];
    }

    var shouldReduce = false;

    // pull the signals from the action
    var signals = Object.keys(observables).reduce(function (obj, key) {
      var observable = observables[key];
      if (observable === payload.action) {
        obj[key] = payload.data;
        shouldReduce = true;
      } else if (observable.dispatchToken) {
        obj[key] = observable.get();
        shouldReduce = true;
      }
      return obj;
    }, {});

    // wait for any derived data
    context.dispatcher.waitFor(dependencies);

    // reduce and output
    if (shouldReduce) {
      var nextState = model.reduce(context, state, signals);
      var output = model.output ? model.output(context, state, nextState) : nextState;
      state = nextState;
      // if no output, no push
      if (output !== undefined) bus.push(output);
    }
  });

  var exports = model.exports ? model.exports(context) : {};

  return Object.keys(exports).reduce(function (obj, key) {
    obj[key] = exports[key];
    return obj;
  }, {
    dispatchToken: dispatchToken,
    subscribe: bus.subscribe,
    get: function get() {
      return state;
    }
  });
}

function MicroFlux() {
  this.dispatcher = new _flux.Dispatcher();
}

MicroFlux.prototype.registerActions = function (actions) {
  var _this = this;

  Object.keys(actions).forEach(function (name) {
    _this[name] = createActions(_this, name, actions[name]);
  });
};

MicroFlux.prototype.registerStores = function (stores) {
  var _this2 = this;

  Object.keys(stores).forEach(function (name) {
    _this2[name] = createStore(_this2, name, stores[name]);
  });
};

MicroFlux.prototype.bootstrap = function (data) {
  this.dispatcher.dispatch({ action: BOOTSTRAP, data: data });
};

exports['default'] = MicroFlux;
module.exports = exports['default'];
