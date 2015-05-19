'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _flux = require('flux');

var _transmitter = require('transmitter');

var _transmitter2 = _interopRequireDefault(_transmitter);

var BOOTSTRAP = {};
var keys = Object.keys;

function createActions(context, name, model) {
  return keys(model).reduce(function (actions, id) {
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
  var signalKeys = keys(observables);

  // setup the dependencies and signals
  var dependencies = signalKeys.map(function (key) {
    return observables[key].dispatchToken;
  }).filter(Boolean);

  var dispatchToken = context.dispatcher.register(function (payload) {
    var action = payload.action;
    var data = payload.data;

    // bootstrap state
    if (action === BOOTSTRAP && data[name]) {
      return state = data[name];
    }

    // pull the signals from the action
    var signals = signalKeys.reduce(function (arr, key) {
      var value = observables[key];
      var list = Array.isArray(value) ? value : [value];
      list.forEach(function (observable) {
        if (observable === action) arr.push([key, data]);else if (observable.dispatchToken) arr.push([key, observable.get()]);
      });
      return arr;
    }, []);

    var emitChange = signals.length;

    // wait for any derived data
    context.dispatcher.waitFor(dependencies);

    // reduce and output
    if (emitChange) {
      var nextState = model.reduce(context, state, signals.reduce(function (o, x) {
        return (o[x[0]] = x[1], o);
      }, {}));
      var output = model.output ? model.output(context, state, nextState) : nextState;
      state = nextState;
      // if no output, no push
      if (output !== undefined) bus.push(output);
    }
  });

  var statics = model.statics ? model.statics(context) : {};

  return keys(statics).reduce(function (obj, key) {
    obj[key] = statics[key];
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

  keys(actions).forEach(function (name) {
    _this[name] = createActions(_this, name, actions[name]);
  });
};

MicroFlux.prototype.registerStores = function (stores) {
  var _this2 = this;

  keys(stores).forEach(function (name) {
    _this2[name] = createStore(_this2, name, stores[name]);
  });
};

MicroFlux.prototype.bootstrap = function (data) {
  this.dispatcher.dispatch({ action: BOOTSTRAP, data: data });
};

exports['default'] = MicroFlux;
module.exports = exports['default'];
